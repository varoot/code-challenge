(function() {
  "use strict";

  function MovieApp() {
    this.apiEndpoint = 'http://www.omdbapi.com/';

    var searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', this.handleSubmit.bind(this), false);

    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');

    this.movie = null;
    this.movieBack = document.getElementById('movie-back');
    this.movieTitle = document.getElementById('movie-title');
    this.movieMessage = document.getElementById('movie-message');
    this.movieDetail = document.getElementById('movie-detail');

    this.favoriteMovies = [];
    this.favoriteList = document.getElementById('favorite-list');
    this.favoriteBtn = document.getElementById('favorite-btn');
    this.favoriteBtnText = document.getElementById('favorite-btn-text');
    this.favoriteBtn.addEventListener('click', this.addToFavorite.bind(this), false);

    this.loadFavorites();

    document.addEventListener('click', this.handleClick.bind(this), false);
  }

  // Form submission handler
  MovieApp.prototype.handleSubmit = function(evt) {
    var query = this.searchInput.value.trim();

    this.searchInput.value = '';

    if (query) {
      this.searchResults.innerHTML = 'Searching for “' + query+ '”...';
      this.searchForMovies(query);
    }

    evt.preventDefault();
  };

  MovieApp.prototype.ajaxCall = function(options) {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open(options.method || 'GET', options.url);
    xhr.onreadystatechange = function() {
      var DONE = 4; // readyState 4 means the request is done.
      var OK = 200; // status 200 is a successful return.
      if (xhr.readyState === DONE) {
        if (xhr.status === OK) {
          // Got responses
          if (options.onSuccess) {
            options.onSuccess(JSON.parse(xhr.response));          
          }
        } else {
          // An error occurred during the request.
          console.log(xhr);
          if (options.onFail) {
            options.onFail(xhr.status + ' ' + xhr.statusText);          
          }
        }
      }
    };
    if (options.method === 'POST') {
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    }
    xhr.send(options.data || null);
  };

  // Create an alert element using Bootstrap's style
  MovieApp.prototype.createErrorMessage = function(message) {
    var el = document.createElement('div');
    el.setAttribute('class', 'alert alert-danger');
    el.setAttribute('role', 'alert');
    el.innerText = message;
    return el;
  };

  // Replace the element with an error alert
  MovieApp.prototype.showError = function(parentElement, message) {
    parentElement.innerHTML = '';
    parentElement.appendChild(this.createErrorMessage(message));
  };

  MovieApp.prototype.resetHome = function() {
    this.searchInput.value = '';
    this.searchResults.innerHTML = '';
  };

  // Make GET request to get the list of movies
  MovieApp.prototype.searchForMovies = function(query) {
    this.ajaxCall({
      url: this.apiEndpoint + '?s=' + encodeURIComponent(query),
      onSuccess: this.displaySearchResults.bind(this),
      onFail: this.showError.bind(this, this.searchResults),
    });
  };

  MovieApp.prototype.movieTitleText = function(movie) {
    if (movie.name) {
      return movie.name;
    } else {
      return movie.Title + ' (' + movie.Year + ')';    
    }
  };

  // Display movie list
  MovieApp.prototype.displayMovieList = function(parentElement, movies) {
    var self = this;
    parentElement.innerHTML = '';
    movies.forEach(function(movie) {
      var link = document.createElement('a');
      link.setAttribute('href', '#');
      link.setAttribute('class', 'list-group-item');
      link.innerText = self.movieTitleText(movie);
      link.addEventListener('click', self.loadMovie.bind(self, movie), false);
      parentElement.appendChild(link);
    });
  };

  MovieApp.prototype.displaySearchResults = function(response) {
    this.displayMovieList(this.searchResults, response.Search);
  };

  MovieApp.prototype.handleClick = function(evt) {
    if (evt.target.classList.contains('js-nav-link')) {
      var targetPage = evt.target.getAttribute('href').slice(1);
      this.switchPage(targetPage, evt.target.classList.contains('js-nav-link-reset'));
      evt.preventDefault();
    }
  };

  MovieApp.prototype.switchPage = function(targetPage, reset) {
    // Toggle Navigation
    var navItems = document.getElementById('nav').children;
    for (var i = 0; i < navItems.length; i++) {
      if (navItems[i].querySelector('a[href="#' + targetPage + '"]')) {
        navItems[i].classList.add('active');
      } else {
        navItems[i].classList.remove('active');
      }
    }

    // Toogle Page Content
    var pages = document.getElementsByClassName('js-page');
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].id === targetPage) {
        pages[i].classList.remove('hidden');
      } else {
        pages[i].classList.add('hidden');     
      }
    }

    if (reset) {
      if (targetPage === 'home') {
        this.resetHome();
      }
      if (targetPage !== 'movie') {
        this.movieBack.setAttribute('href', '#' + targetPage);
      }
    }
  };

  MovieApp.prototype.loadMovie = function(movie, evt) {
    this.movie = movie;
    this.movieTitle.innerText = this.movieTitleText(movie);
    this.movieMessage.innerText = 'Loading...';
    this.movieDetail.classList.add('hidden');
    this.ajaxCall({
      url: this.apiEndpoint + '?i=' + encodeURIComponent(movie.oid || movie.imdbID),
      onSuccess: this.displayMovieData.bind(this),
      onFail: this.showError.bind(this, this.movieMessage),
    });
    this.updateFavoriteBtn();
    this.switchPage('movie');
    evt.preventDefault();
  };

  MovieApp.prototype.isFavorited = function(imdbID) {
    var isFavorited = false;
    this.favoriteMovies.forEach(function(movie) {
      if (movie.oid === imdbID) {
        isFavorited = true;
      }
    });
    return isFavorited;
  };

  MovieApp.prototype.updateFavoriteBtn = function() {
    if (this.isFavorited(this.movie.imdbID)) {
      this.favoriteBtn.classList.remove('btn-default');
      this.favoriteBtn.classList.add('btn-primary');
      this.favoriteBtn.setAttribute('disabled', 'disabled');
      this.favoriteBtnText.innerText = 'Favorited';
    } else {
      this.favoriteBtn.classList.add('btn-default');
      this.favoriteBtn.classList.remove('btn-primary');
      this.favoriteBtn.removeAttribute('disabled');    
      this.favoriteBtnText.innerText = 'Add to Favorite';
    }
  };

  MovieApp.prototype.displayMovieData = function(movie) {
    this.movie = movie;
    this.movieMessage.innerHTML = '';
    var fields = this.movieDetail.querySelectorAll('[data-field]');
    for (var i = 0; i < fields.length; i++) {
      var key = fields[i].getAttribute('data-field');
      fields[i].innerText = movie[key] || '';
    }
    this.movieDetail.classList.remove('hidden');
  };

  MovieApp.prototype.loadFavorites = function() {
    this.ajaxCall({
      url: '/favorites',
      onSuccess: this.updateFavorites.bind(this),
    });
  };

  MovieApp.prototype.updateFavorites = function(response) {
    this.favoriteMovies = response;
    if (response.length) {
      this.displayMovieList(this.favoriteList, response);        
    } else {
      this.favoriteList.innerText = 'You have not yet added any movies to your Favorite list';
    }
    if (this.movie) {
      this.updateFavoriteBtn();    
    }
  };

  MovieApp.prototype.addToFavorite = function(evt) {
    if (!this.movie || !this.movie.imdbID) {
      // No movie, exit
      return;
    }

    this.ajaxCall({
      method: 'POST',
      url: '/favorites',
      data: 'name=' + encodeURIComponent(this.movieTitleText(this.movie)) + '&oid=' + encodeURIComponent(this.movie.imdbID),
      onSuccess: this.updateFavorites.bind(this),
    })
  };

  var app = new MovieApp();
})();
