from django.db import models
from django.contrib.auth.models import User
from random import choice

# Create your models here.
class Game(models.Model):
    #player = models.ForeignKey(User, related_name='player')
    word = models.CharField(max_length=60, default='')
    current_word = models.CharField(max_length=60, default='')
    guess_count = models.IntegerField(default=6)

    def generate_word(self):
        return choice(['disparity', 'aberrant', 'adumbrate', 'transmogrify', 'uxorious'])

class Guess(models.Model):
    LETTERS = ['a','b','c','d','e','f','g','h','i','j','k','l',\
            'm','n','o','p','q','r','s','t','u','v','w','x','y','z']
    game = models.ForeignKey(Game, related_name="guesses")
    letter = models.CharField(max_length=2)
    status = models.BooleanField(default=False)
