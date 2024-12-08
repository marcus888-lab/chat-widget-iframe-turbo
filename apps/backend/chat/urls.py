from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('sessions/', views.ChatSessionListCreateView.as_view(), name='chat-sessions'),
    path('sessions/<uuid:pk>/', views.ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('messages/', views.MessageListCreateView.as_view(), name='messages'),
    path('messages/<uuid:pk>/', views.MessageDetailView.as_view(), name='message-detail'),
]
