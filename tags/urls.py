from django.urls import path
from . import views


app_name = 'tags'
urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('allTags/', views.TagList.as_view(), name='tag_list'),
    path('updateTags/', views.TagUpdate.as_view(), name = 'tag_update')
]