import mongoengine as me
from datetime import datetime

class User(me.Document):
    """ User model for MongoDB using MongoEngine. """
    name: str = me.StringField(required=True)
    email: str = me.StringField(required=True, unique=True)
    hashedPassword: str= me.StringField(required=True, min_length=8, max_length=164)
    createdAt:datetime = me.DateTimeField(default=datetime.utcnow)
