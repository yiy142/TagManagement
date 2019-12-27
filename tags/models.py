from django.db import models


# Create your models here.
class Tag(models.Model):
    id = models.IntegerField(primary_key=True, default=0)
    tag_text = models.CharField(max_length=200)
    parent_id = models.IntegerField()
    layer = models.IntegerField(null=False, default=-1)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return self.tag_text