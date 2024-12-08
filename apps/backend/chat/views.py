from rest_framework import generics
from .models import ChatSession, Message
from .serializers import ChatSessionSerializer, MessageSerializer


class ChatSessionListCreateView(generics.ListCreateAPIView):
    queryset = ChatSession.objects.all()
    serializer_class = ChatSessionSerializer


class ChatSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ChatSession.objects.all()
    serializer_class = ChatSessionSerializer


class MessageListCreateView(generics.ListCreateAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer


class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
