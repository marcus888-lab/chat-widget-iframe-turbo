from django.contrib import admin
from .models import ChatSession, Message, ToolExecution

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'session_id', 'created_at', 'updated_at')
    search_fields = ('id', 'session_id')
    readonly_fields = ('id', 'created_at', 'updated_at')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'role', 'created_at')
    list_filter = ('role',)
    search_fields = ('id', 'session__id', 'content')
    readonly_fields = ('id', 'created_at')

@admin.register(ToolExecution)
class ToolExecutionAdmin(admin.ModelAdmin):
    list_display = ('id', 'message', 'tool_name', 'created_at')
    list_filter = ('tool_name',)
    search_fields = ('id', 'message__id', 'tool_name')
    readonly_fields = ('id', 'created_at')
