



function make_slides(f) {
  var   slides = {}; //Create an empty list of experiment slides.

  //Intro slide: starts the timer
  slides.i0 = slide({
     name : "i0",
     start: function() {
      exp.startT = Date.now();
     }
  });

  // Consent slide: participant must check the box before continuing
slides.consent = slide({
  name : "consent",

  start: function() {
    $("#consent_err").hide();
  },

  button : function() {
    if ($("#consent_yes").is(":checked")) {
      exp.consent = "yes";
      exp.go();
    } else {
      $("#consent_err").show();
    }
  }
});

  // Lesson video slide: randomly shows either the subjectivity or traditional video
slides.lesson_video = slide({
  name : "lesson_video",

  start: function() {
    exp.video_completed = false;
    exp.max_video_time = 0;

    var video = document.getElementById("video_player");

    // Hide native video controls so participants cannot fast-forward using the control bar
    video.removeAttribute("controls");

    // Load the video selected by exp.video_condition: subj-movie.mp4 or trad-movie.mp4
    video.src = "expt-files/" + exp.video_condition + "-movie.mp4";
    video.currentTime = 0;
    video.load();

    $("#video_err").hide();
    $("#video_continue_button").hide();
    $("#play_video_button").show();

    // Custom play button
    $("#play_video_button").off("click").on("click", function() {
      video.play();
      $("#play_video_button").hide();
    });

    // Track the farthest point watched
    video.ontimeupdate = function() {
      if (video.currentTime > exp.max_video_time) {
        exp.max_video_time = video.currentTime;
      }
    };

    // Prevent skipping ahead, even if someone somehow tries to seek
    video.onseeking = function() {
      if (video.currentTime > exp.max_video_time + 0.5) {
        video.currentTime = exp.max_video_time;
      }
    };

    // Only allow the participant to continue after the video ends
    video.onended = function() {
      exp.video_completed = true;
      $("#video_continue_button").show();
    };
  },

  button : function() {
    if (exp.video_completed) {
      exp.go();
    } else {
      $("#video_err").show();
    }
  }
});


  //Instructions slide: moves to the next slide when Continue is clicked.
  slides.instructions1 = slide({
    name : "instructions1",
    start: function() {
      $(".instruction_condition").html("Between subject instruction manipulation: "+ exp.instruction);
    }, 
    button : function() {
      exp.go(); //use exp.go() if and only if there is no "present" data. - Meaning "Go to the next slide."
    }
  });

  //Main rating task slide
  slides.multi_slider = slide({
    name : "multi_slider",

    //Present stimuli in random order. The stimuli come from corpus.js
    present : _.shuffle(stimuli),

    //For each trial, fill in the noun and adjective orders
    present_handle : function(stim) {
      $(".err").hide();
      this.init_sliders();      
      exp.sliderPost = null;
      this.stim = stim;


      $(".noun").html(stim.Noun);

      $(".low").html("\"the "+ stim.Predicate2 + " " + stim.Predicate1 + " " + stim.Noun + "\"");

      $(".high").html("\"the "+ stim.Predicate1 + " " + stim.Predicate2 + " " + stim.Noun + "\"");

		this.n_sliders = 1;

    },

    //Continue only if the participant moved the slider
    button : function() {
    	console.log(exp.sliderPost);
      if (exp.sliderPost != null) {
        this.log_responses();
        _stream.apply(this); //use exp.go() if and only if there is no "present" data.
      } else {
        $(".err").show();
      }
    },

    //Create slider and temporarily store its current value
    init_sliders : function() {
      utils.make_slider("#slider0", function(event, ui) {
        exp.sliderPost = ui.value;
      });
    },

    ////Save the slider response and the words shown on this trial
    log_responses : function() {
        exp.data_trials.push({
          "response" : exp.sliderPost,
          "noun" : this.stim.Noun,  
          "nounclass" : this.stim.NounClass,        
          "predicate1" : this.stim.Predicate1,
          "predicate2" : this.stim.Predicate2,
          "class1" : this.stim.Class1,
          "class2" : this.stim.Class2,                     
          "slide_number" : exp.phase
        });
    },
  });

  // Demographic and language-background slide
slides.subj_info =  slide({
  name : "subj_info",

  submit : function(e){
    exp.subj_data = {
      assess : $('input[name="assess"]:checked').val(),
      age_range : $("#age_range").val(),
      first_language : $("#first_language").val(),
      in_argentina : $("#in_argentina").val(),
      current_english_study : $("#current_english_study").val(),
      previous_english_study : $("#previous_english_study").val(),
      english_level : $("#english_level").val(),
      english_at_home : $("#english_at_home").val(),
      learned_adj_order : $("#learned_adj_order").val(),
      comments : $("#comments").val(),
    };

    exp.go();
  }
});

  //Final slide: collect and submit data
  slides.thanks = slide({
    name : "thanks",
    start : function() {
      exp.data= {
          "trials" : exp.data_trials,
          "catch_trials" : exp.catch_trials,
          "system" : exp.system,
          "video_condition" : exp.video_condition,
          "consent" : exp.consent,
          "subject_information" : exp.subj_data,
          "time_in_minutes" : (Date.now() - exp.startT)/60000
      };
      setTimeout(function() {turk.submit(exp.data);}, 1000);
    }
  });

  return slides;
}

/// init ///
function init() {
  exp.trials = [];
  exp.catch_trials = [];

  //Randomly choose one of two instruction conditions
  exp.instruction = _.sample(["instruction1","instruction2"]);
  
  //Save browser and screen info
  exp.system = {
      Browser : BrowserDetect.browser,
      OS : BrowserDetect.OS,
      screenH: screen.height,
      screenUH: exp.height,
      screenW: screen.width,
      screenUW: exp.width
    };

  //Order of the experiment slides:
  exp.structure=['consent', "i0", "lesson_video", "instructions1",'multi_slider', 'subj_info', 'thanks'];
  
  exp.data_trials = [];
  
  //Create the slides defined above:
  exp.slides = make_slides(exp);

  //between-subject factor
  exp.video_condition = _.sample(["subj", "trad"]);

  //Calculate total experiment length for progress bar:
  exp.nQs = utils.get_exp_length(); //this does not work if there are stacks of stims (but does work for an experiment with this structure)
                    //relies on structure and slides being defined

  $('.slide').hide(); //hide everything

  //Start button behavior??
  $("#start_button").click(function() {
    if (turk.previewMode) {
      $("#mustaccept").show();
    } else {
      $("#start_button").click(function() {$("#mustaccept").show();});
      exp.go();
    }
  });

  exp.go(); //show first slide
}