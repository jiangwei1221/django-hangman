$(function() {

    Handlebars.registerHelper('displayCharacter', function() {
        if (this == " ") {
            return new Handlebars.SafeString('<span class="spacer"></span>');
        } else {
            return new Handlebars.SafeString('<span class="placeholder">' + this + '</span>');
        }
    })

    window.Game = Backbone.Model.extend({

        defaults: {
            guesses: 10,
            word: '',
            game_id: '',
        },

        initialize: function() {
            this.set({
                win: false,
                lost: false
            });

            this.new();

        },

        new: function() {
            var _this = this;

            $.ajax({
                url: "/new/",
                type: "POST",
                error: function(response) {
                    var json = $.parseJSON(response.responseText);
                    _this.set({word: json.word})
                    _this.set({game_id: json.game})

                    _this.set({lost: false});
                    _this.set({win: false});

                    _this.trigger("gameStartedEvent", json);

                }
            })
        },

        check: function() {
            var _this = this;

            if (_this.get("lost") || _this.get("win")) return;

            $.ajax({
                url: "/check/",
                type: "POST",
                data: {
                    letter_guess: this.get("char_clicked"),
                    game_id: this.get("game_id")
                },
                error: function(response) {
                    var json = $.parseJSON(response.responseText);

                    //if (json.incorrect_guesses >= _this.get("threshold")) _this.set({lost: true});
                    //if (json.win) _this.set({win: true});

                    _this.trigger("guessCheckedEvent", json);
                }
            })
        }
    })

    window.OptionsView = Backbone.View.extend({
        el: $("#options"),
        initialize: function() {
            this.model.bind("gameStartedEvent", this.removeGetAnswerButton, this);
            this.model.bind("guessCheckedEvent", this.showGetAnswerButton, this);
        },
        events: {
            'click #new_game': 'startNewGame',
            'click #show_answer': 'showAnswer'
        },
        startNewGame: function() {
            this.model.new();
        },
        removeGetAnswerButton: function() {
            $("#show_answer").remove();
        },
        showGetAnswerButton: function(response) {
            if (response.incorrect_guesses == this.model.get("threshold")) {
                $("#show_answer", this.el).show();
            }
        },
        showAnswer: function() {
            this.model.get_answer();
        }
    })

    window.WordView = Backbone.View.extend({
        el: $("#word"),
        initialize: function() {
            this.compileTemplates();
            this.model.bind("gameStartedEvent", this.render, this);
            this.model.bind("guessCheckedEvent", this.displayGuessResult, this);
        },
        compileTemplates: function() {
            var template_source = $("#word_template").html();
            this.template = Handlebars.compile(template_source);
        },
        render: function(response) {
            var html = this.template({characters: response.word.split('')});
            $(this.el).hide();
            $(this.el).html(html).show();
        },
        displayGuessResult: function(response) {
            console.log(response);
            var html = this.template({characters: response.word.split('')});
            $(this.el).html(html);
        }
    })

    window.CharactersView = Backbone.View.extend({
        el: $("#characters"),
        initialize: function() {
            this.compileTemplates();
            this.model.bind("gameStartedEvent", this.render, this);
            this.model.bind("guessCheckedEvent", this.disableCharacter, this);
        },
        events: {
            'click .character': 'charClicked'
        },
        compileTemplates: function() {
            var character_template = $("#character_template").html();
            this.character_template = Handlebars.compile(character_template)
        },
        render: function() {
            var chars = this.character_template({characters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',]})
            $(this.el).html(chars).show();
        },
        charClicked: function(event) {
            if (this.model.get("lost")) return;

            var target = $(event.target);
            this.model.unset("target")
            this.model.set({char_clicked: target.attr("char"), target: target});
            this.model.check();
        },
        disableCharacter: function(response) {
            this.model.get("target").removeClass("character").addClass("disabled");
        }
    })



    window.HangmanView = Backbone.View.extend({
        el: $("#ground"),
        initialize: function() {
            this.setupSelectors();
            this.model.bind("gameStartedEvent", this.clearHangman, this);
            this.model.bind("guessCheckedEvent", this.drawHangman, this);
        },
        setupSelectors: function() {
            this.body_parts = [$("#left_leg"), $("#right_leg"), $("#left_arm"), $("#right_arm"), $("#body"), $("#head")];
        },
        drawHangman: function(response) {
            console.log(response.guess_count);
            if (!response.status) $(this.body_parts[parseInt(response.guess_count)+1]).css("visibility", "visible");

            if (response.guess_count < 0) alert("You're dead.");
        },
        clearHangman: function() {
            $("#string").css("visibility", "visible")

            _.each(this.body_parts, function(part) {
                part.css("visibility", "hidden");
            })
        }
    })


    window.AnswerView = Backbone.View.extend({
        el: $("#answer"),
        initialize: function() {
            this.model.bind("gameStartedEvent", this.hide, this);
            this.model.bind("guessCheckedEvent", this.render, this);
        },
        render: function(response) {
            if (response.guess_count < 0) $(this.el).html("Answer: " + response.answer).show();
        },
        hide: function() {
            $(this.el).hide();
        }
    })

    window.GuessView = Backbone.View.extend({
        el: $("#guesses"),
        initialize: function() {
            this.model.bind("gameStartedEvent", this.clearGuesses, this);
            this.model.bind("guessCheckedEvent", this.showGuess, this);
        },

        clearGuesses: function(response) {
             $(this.el).html('');
        },

        showGuess: function(response) {
            if (response.status) {
                $(this.el).append('<li>Guess #'+response.guess_id+' <span style="color:green">'+response.guess+'</li>')
            } else {
                $(this.el).append('<li>Guess #'+response.guess_id+' <span style="color:red">'+response.guess+'</li>')
            }
        }
    })


    var game            = new Game
    var options_view    = new OptionsView({model: game})
    var characters_view = new CharactersView({model: game})
    var word_view       = new WordView({model: game})
    var hangman_view    = new HangmanView({model: game})
    var answer_view     = new AnswerView({model: game})
    var guess_view      = new GuessView({model: game})

})
