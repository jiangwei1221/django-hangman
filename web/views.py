# Create your views here.
from web.models import *
from django.contrib.auth.models import User
from django.shortcuts import render_to_response, redirect
from django.http import HttpResponse

import json

def home(request):
    return render_to_response('index.html')

def new(request):
    new_game = Game()
    new_game.word = new_game.generate_word()
    new_game.current_word = "_" * len(new_game.word)
    new_game.save()

    data = json.dumps({
        'word': "_" * len(new_game.word),
        'solution': new_game.word,
        'player': request.user.username or '',
        'game': new_game.id
    })
    return HttpResponse(data,'application/javascript')

def check(request):
    game_id = request.POST.get('game_id')
    letter_guess = request.POST.get('letter_guess').lower()

    game = Game.objects.get(id=game_id)
    guess = Guess(game=game, letter=letter_guess)

    guess.status = letter_guess in list(game.word.lower()) and True or False
    guess.save()

    letters = []
    for guess in game.guesses.all():
        letters.append(guess.letter.lower())

    correct = []
    tmp_word = game.word

    if guess.status == False:
        game.guess_count -= 1
        game.save()

    for w in list(game.word):
        if w.lower() not in letters:
            tmp_word = tmp_word.replace(w,"_")

    data = json.dumps({
        'guess_count': game.guess_count,
        'word': tmp_word,
        'status': guess.status,
        'answer': game.word,
        'guess': letter_guess,
        'guess_id': guess.id
    })
    return HttpResponse(data,'application/javascript')

#def answer(request):


