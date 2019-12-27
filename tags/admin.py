from django.contrib import admin
from .models import Tag


class TagAdmin(admin.ModelAdmin):
    fields = ['tag_text', 'parent_id']

admin.site.register(Tag, TagAdmin)