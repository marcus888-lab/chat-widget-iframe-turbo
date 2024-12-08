from typing import List, Dict, Any
from django.db.models import Q
from django.contrib.postgres.search import SearchQuery, SearchRank
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel, AutoImageProcessor
from PIL import Image
import numpy as np
from .models import Product
from pgvector.django import L2Distance

class ProductSearchService:
    """Service for hybrid product search using pgvector and text search"""

    def __init__(self):
        # Initialize text model
        self.tokenizer = AutoTokenizer.from_pretrained('nomic-ai/nomic-embed-text-v1.5')
        self.text_model = AutoModel.from_pretrained('nomic-ai/nomic-embed-text-v1.5', trust_remote_code=True)
        self.text_model.eval()

        # Initialize vision model
        self.image_processor = AutoImageProcessor.from_pretrained("nomic-ai/nomic-embed-vision-v1.5")
        self.vision_model = AutoModel.from_pretrained("nomic-ai/nomic-embed-vision-v1.5", trust_remote_code=True)
        self.vision_model.eval()

    def _get_text_embedding(self, text: str) -> List[float]:
        """Get embedding vector for text using nomic-embed-text"""
        # Add required prefix
        text_with_prefix = f"search_query: {text}"

        # Tokenize and encode
        encoded_input = self.tokenizer(
            text_with_prefix,
            padding=True,
            truncation=True,
            return_tensors='pt'
        )

        # Get embeddings
        with torch.no_grad():
            model_output = self.text_model(**encoded_input)

        # Mean pooling
        token_embeddings = model_output[0]
        attention_mask = encoded_input['attention_mask']
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        embeddings = torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

        # Normalize
        embeddings = F.layer_norm(embeddings, normalized_shape=(embeddings.shape[1],))
        embeddings = F.normalize(embeddings, p=2, dim=1)

        return embeddings[0].numpy().tolist()

    def _get_image_embedding(self, image: Image) -> List[float]:
        """Get embedding vector for image using nomic-embed-vision"""
        # Process image
        inputs = self.image_processor(image, return_tensors="pt")

        # Get embeddings
        with torch.no_grad():
            img_emb = self.vision_model(**inputs).last_hidden_state
            embeddings = F.normalize(img_emb[:, 0], p=2, dim=1)

        return embeddings[0].numpy().tolist()

    def _combine_scores(self, text_score: float, vector_score: float, weights: Dict[str, float] = None) -> float:
        """Combine text and vector search scores

        Args:
            text_score: Score from text search (0-1)
            vector_score: Score from vector search (cosine similarity, -1 to 1)
            weights: Optional dict with 'text' and 'vector' weights (default: equal weights)
        """
        weights = weights or {'text': 0.5, 'vector': 0.5}

        # Normalize vector score from [-1,1] to [0,1]
        vector_score = (vector_score + 1) / 2

        return (
            weights['text'] * text_score +
            weights['vector'] * vector_score
        )

    def search(
        self,
        query: str,
        image_query: Image = None,
        limit: int = 10,
        category: str = None,
        min_price: float = None,
        max_price: float = None,
        weights: Dict[str, float] = None,
        include_signed_urls: bool = False
    ) -> Dict[str, Any]:
        """Perform hybrid search on products

        Args:
            query: Search query string
            image_query: Optional PIL Image for visual similarity search
            limit: Maximum number of results (default: 10)
            category: Optional category filter
            min_price: Optional minimum price filter
            max_price: Optional maximum price filter
            weights: Optional dict with 'text' and 'vector' weights for scoring
            include_signed_urls: Whether to refresh signed URLs in results

        Returns:
            Dict containing search results and metadata
        """
        # Get query embeddings
        query_embedding = self._get_text_embedding(query)

        # Get image embedding if provided
        image_embedding = None
        if image_query:
            image_embedding = self._get_image_embedding(image_query)

        # Base queryset with filters
        queryset = Product.objects.all()

        if category:
            queryset = queryset.filter(category=category)
        if min_price is not None:
            queryset = queryset.filter(price__gte=min_price)
        if max_price is not None:
            queryset = queryset.filter(price__lte=max_price)

        # Text search
        search_query = SearchQuery(query, config='english')
        queryset = queryset.annotate(
            text_rank=SearchRank('search_vector', search_query)
        )

        # Vector search using L2 distance
        queryset = queryset.annotate(
            vector_rank=1 - L2Distance('embedding', query_embedding)
        )

        # Combine scores and prepare results
        results = []
        for product in queryset[:limit]:
            combined_score = self._combine_scores(
                float(product.text_rank or 0),
                float(product.vector_rank or 0),
                weights
            )

            # Refresh signed URL if needed
            if include_signed_urls:
                product.refresh_signed_url()

            result = {
                "name": product.name,
                "description": product.description,
                "category": product.category,
                "price": float(product.price),
                "signed_url": product.signed_url,
                "scores": {
                    "text": float(product.text_rank or 0),
                    "vector": float(product.vector_rank or 0),
                    "hybrid": combined_score
                }
            }

            results.append(result)

        # Sort by combined score
        results.sort(key=lambda x: x["scores"]["hybrid"], reverse=True)

        return {
            "data": results,
            "metadata": {
                "search_type": "hybrid" + (" + multimodal" if image_query else ""),
                "total_results": len(results),
                "weights": weights or {'text': 0.5, 'vector': 0.5}
            }
        }
