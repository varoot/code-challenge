(function() {
  "use strict";

  function ajaxCall(options) {
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
  }

  function MovieApp() {
    this.movieEndpoint = 'http://www.omdbapi.com/';
    this.favoriteEndpoint = '/favorites';

    this.searchInput = document.getElementById('search-input');
    this.searchResults = document.getElementById('search-results');
    var searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', this.handleSubmit.bind(this), false);

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

    // We listen to click on document so we don't need to add individual listeners for each link
    document.addEventListener('click', this.handleClick.bind(this), false);
  }

  // Handle navigation links
  MovieApp.prototype.handleClick = function(evt) {
    if (evt.target.classList.contains('js-nav-link')) {
      var targetPage = evt.target.getAttribute('href').slice(1);
      this.switchPage(targetPage, evt.target.classList.contains('js-nav-link-reset'));
      evt.preventDefault();
    }
  };

  // Navigating between "pages"
  MovieApp.prototype.switchPage = function(targetPage, reset) {
    // Toggle navigation menu
    var i;
    var navItems = document.getElementById('nav').children;
    for (i = 0; i < navItems.length; i++) {
      // Check if this menu contains the link to target page
      if (navItems[i].querySelector('a[href="#' + targetPage + '"]')) {
        navItems[i].classList.add('active');
      } else {
        navItems[i].classList.remove('active');
      }
    }

    // Toogle page content
    var pages = document.getElementsByClassName('js-page');
    for (i = 0; i < pages.length; i++) {
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
      // Set the target of the Back button on Movie page
      if (targetPage !== 'movie') {
        this.movieBack.setAttribute('href', '#' + targetPage);
      }
    }
  };

  // Form submission handler
  MovieApp.prototype.handleSubmit = function(evt) {
    var query = this.searchInput.value.trim();

    // Clean up input
    this.searchInput.value = '';

    if (query) {
      // Display "searching" text
      this.searchResults.innerHTML = 'Searching for “' + query+ '”...';
      this.searchForMovies(query);
    }

    evt.preventDefault();
  };

  // Create an alert element using Bootstrap's style
  MovieApp.prototype.createErrorMessage = function(message) {
    var el = document.createElement('div');
    el.setAttribute('class', 'alert alert-danger');
    el.setAttribute('role', 'alert');
    el.innerText = message;
    return el;
  };

  // Replace parent content with an error alert
  MovieApp.prototype.showError = function(parentElement, message) {
    parentElement.innerHTML = '';
    parentElement.appendChild(this.createErrorMessage(message));
  };

  // Clear search results/input
  MovieApp.prototype.resetHome = function() {
    this.searchInput.value = '';
    this.searchResults.innerHTML = '';
  };

  // Make GET request to get the list of movies
  MovieApp.prototype.searchForMovies = function(query) {
    ajaxCall({
      url: this.movieEndpoint + '?s=' + encodeURIComponent(query),
      onSuccess: this.displaySearchResults.bind(this),
      onFail: this.showError.bind(this, this.searchResults),
    });
  };

  // Title Text = Title (Year)
  // For favorited movies, we've already saved this text as "name"
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

      // Attach a click to detail page
      link.addEventListener('click', self.loadMovie.bind(self, movie), false);
      parentElement.appendChild(link);
    });
  };

  // Only use "Search" part of the response
  MovieApp.prototype.displaySearchResults = function(response) {
    this.displayMovieList(this.searchResults, response.Search);
  };

  // GET request for movie detail
  MovieApp.prototype.loadMovie = function(movie, evt) {
    // Save this so we can use it to add to favorite
    this.movie = movie;
    this.movieTitle.innerText = this.movieTitleText(movie);
    this.movieMessage.innerText = 'Loading...';

    // Hide detail part until we get the data
    this.movieDetail.classList.add('hidden');
    ajaxCall({
      url: this.movieEndpoint + '?i=' + encodeURIComponent(movie.oid || movie.imdbID),
      onSuccess: this.displayMovieData.bind(this),
      onFail: this.showError.bind(this, this.movieMessage),
    });
    this.updateFavoriteBtn();
    this.switchPage('movie');
    evt.preventDefault();
  };

  // Check if movie is already favorited
  MovieApp.prototype.isFavorited = function(imdbID) {
    var isFavorited = false;
    this.favoriteMovies.forEach(function(movie) {
      if (movie.oid === imdbID) {
        isFavorited = true;
      }
    });
    return isFavorited;
  };

  // Enable/disable favorite button based on whether the movie is already favorited
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

  // Show movie details according to the fields on the template
  MovieApp.prototype.displayMovieData = function(movie) {
    this.movie = movie;
    this.movieMessage.innerHTML = '';
    var fields = this.movieDetail.querySelectorAll('[data-field]');
    for (var i = 0; i < fields.length; i++) {
      var key = fields[i].getAttribute('data-field');
      fields[i].innerText = movie[key] || '';
    }
    // Un-hide the detail part
    this.movieDetail.classList.remove('hidden');
  };

  // GET list of favorite movies from our backend
  MovieApp.prototype.loadFavorites = function() {
    ajaxCall({
      url: this.favoriteEndpoint,
      onSuccess: this.displayFavorites.bind(this),
    });
  };

  // Display favorite movies
  MovieApp.prototype.displayFavorites = function(response) {
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
    evt.preventDefault();

    if (!this.movie || !this.movie.imdbID) {
      // No movie, do nothing
      return;
    }

    ajaxCall({
      method: 'POST',
      url: this.favoriteEndpoint,
      data: 'name=' + encodeURIComponent(this.movieTitleText(this.movie)) + '&oid=' + encodeURIComponent(this.movie.imdbID),
      onSuccess: this.displayFavorites.bind(this),
    });
  };

  var app = new MovieApp();
})();
