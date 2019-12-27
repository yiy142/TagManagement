from django.shortcuts import get_object_or_404, render
from django.views import generic, View
from django.http import Http404, HttpResponseRedirect, JsonResponse, HttpResponse
from django.urls import reverse
from .models import Tag
from django.views.decorators.csrf import csrf_protect
import json

# Create your views here.
class IndexView(generic.ListView):
    template_name = 'tags/index.html'

    def get_queryset(self):
        return Tag.objects.all()


class TagList(View):
    def get(self, request):
        tags =  list(Tag.objects.all().values())
        data =  dict()
        data['tags'] = tags
        return JsonResponse(data)


class TagUpdate(View):
    def post(self, request):
        tot = 0
        if request.is_ajax():
            #Update the DataBase
            strBody = request.body.decode('utf-8')
            d = json.loads(strBody)

            # Loop Through Each Type
            for queryType in d:
                print(queryType)
                if queryType == 'Delete':
                    for toDeleteTag in d[queryType]:
                        tag = Tag.objects.get(id=toDeleteTag["id"])
                        tag.deleted = True
                        tag.save()
                        print("deleted tag: ", toDeleteTag["id"])
                        tot+=1
                elif queryType == 'Create':
                    for toCreateTag in d[queryType]:
                        tag = Tag(id = toCreateTag["id"], tag_text = toCreateTag["tag_text"], parent_id= toCreateTag["parent_id"],layer=toCreateTag["layer"], deleted=toCreateTag["deleted"])
                        tag.save()
                        print("created tag: ", tag.id)
                        tot += 1
                elif queryType == 'Update':
                    for toUpdateTag in d[queryType]:
                        tag = Tag.objects.get(id=toUpdateTag["id"])
                        tag.tag_text = toUpdateTag["new_value"]
                        tag.save()
                        print("updated tag: ", tag.id)
                        tot += 1
        data = {
            'rowsAffected' : tot
        }
        return JsonResponse(data)