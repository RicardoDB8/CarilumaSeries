// Data

const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  params: {
    'api_key': API_KEY,
  },
});

function likedSeriesList() {
  const item = JSON.parse(localStorage.getItem('liked_series'));
  return item ? item : {};
}

function likeSeries(series) {
  const likedSeries = likedSeriesList();

  if (likedSeries[series.id]) {
    likedSeries[series.id] = undefined;
  } else {
    likedSeries[series.id] = series;
  }

  localStorage.setItem('liked_series', JSON.stringify(likedSeries));
}

// Utils

const lazyLoader = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const url = entry.target.getAttribute('data-img');
      entry.target.setAttribute('src', url);
    }
  });
});

function createSeries(
  series,
  container,
  {
    lazyLoad = false,
    clean = true,
  } = {}
) {
  if (clean) {
    container.innerHTML = '';
  }

  series.forEach(serie => {
    const serieContainer = document.createElement('div');
    serieContainer.classList.add('movie-container');

    const serieImg = document.createElement('img');
    serieImg.classList.add('movie-img');
    serieImg.setAttribute('alt', serie.name);
    serieImg.setAttribute(
      lazyLoad ? 'data-img' : 'src',
      'https://image.tmdb.org/t/p/w300' + serie.poster_path,
    );
    serieImg.addEventListener('click', () => {
      location.hash = '#serie=' + serie.id;
    });
    serieImg.addEventListener('error', () => {
      serieImg.setAttribute(
        'src',
        'https://static.platzi.com/static/images/error/img404.png',
      );
    });

    const serieBtn = document.createElement('button');
    serieBtn.classList.add('movie-btn');
    likedSeriesList()[serie.id] && serieBtn.classList.add('movie-btn--liked');
    serieBtn.addEventListener('click', () => {
      serieBtn.classList.toggle('movie-btn--liked');
      likeSeries(serie);
    });

    if (lazyLoad) {
      lazyLoader.observe(serieImg);
    }

    serieContainer.appendChild(serieImg);
    serieContainer.appendChild(serieBtn);
    container.appendChild(serieContainer);
  });
}

function createCategories(categories, container) {
  container.innerHTML = '';

  categories.forEach(category => {
    const categoryContainer = document.createElement('div');
    categoryContainer.classList.add('category-container');

    const categoryTitle = document.createElement('h3');
    categoryTitle.classList.add('category-title');
    categoryTitle.setAttribute('id', 'id' + category.id);
    categoryTitle.addEventListener('click', () => {
      location.hash = `#tv-category=${category.id}-${category.name}`;
    });
    const categoryTitleText = document.createTextNode(category.name);

    categoryTitle.appendChild(categoryTitleText);
    categoryContainer.appendChild(categoryTitle);
    container.appendChild(categoryContainer);
  });
}

// API Calls

let page = 1;
let maxPage;

async function getTrendingSeriesPreview() {
  const { data } = await api('trending/tv/day');
  const series = data.results;

  createSeries(series, trendingSeriesPreviewList, { lazyLoad: true });
}

async function getSeriesCategoriesPreview() {
  const { data } = await api('genre/tv/list');
  const categories = data.genres;

  createCategories(categories, categoriesPreviewList);
}

async function getSeriesByCategory(id) {
  const { data } = await api('discover/tv', {
    params: {
      with_genres: id,
    },
  });
  const series = data.results;
  maxPage = data.total_pages;

  createSeries(series, genericSection, { lazyLoad: true });
}

function getPaginatedSeriesByCategory(id) {
  return async function () {
    const {
      scrollTop,
      scrollHeight,
      clientHeight
    } = document.documentElement;

    const scrollIsBottom = (scrollTop + clientHeight) >= (scrollHeight - 15);
    const pageIsNotMax = page < maxPage;

    if (scrollIsBottom && pageIsNotMax) {
      page++;
      const { data } = await api('discover/tv', {
        params: {
          with_genres: id,
          page,
        },
      });
      const series = data.results;

      createSeries(series, genericSection, { lazyLoad: true, clean: false });
    }
  }
}

async function getSeriesBySearch(query) {
  const { data } = await api('search/tv', {
    params: { query },
  });
  const series = data.results;
  maxPage = data.total_pages;

  createSeries(series, genericSection);
}

function getPaginatedSeriesBySearch(query) {
  return async function () {
    const {
      scrollTop,
      scrollHeight,
      clientHeight
    } = document.documentElement;

    const scrollIsBottom = (scrollTop + clientHeight) >= (scrollHeight - 15);
    const pageIsNotMax = page < maxPage;

    if (scrollIsBottom && pageIsNotMax) {
      page++;
      const { data } = await api('search/tv', {
        params: { query, page },
      });
      const series = data.results;

      createSeries(series, genericSection, { lazyLoad: true, clean: false });
    }
  }
}

async function getSeriesById(id) {
  const { data: serie } = await api('tv/' + id);

  const serieImgUrl = 'https://image.tmdb.org/t/p/w500' + serie.poster_path;
  headerSection.style.background = `
    linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.35) 19.27%,
      rgba(0, 0, 0, 0) 29.17%
    ),
    url(${serieImgUrl})
  `;

  movieDetailTitle.textContent = serie.name;
  movieDetailDescription.textContent = serie.overview;
  movieDetailScore.textContent = serie.vote_average;

  createCategories(serie.genres, movieDetailCategoriesList);

  getRelatedSeriesId(id);
}

async function getRelatedSeriesId(id) {
  const { data } = await api(`tv/${id}/recommendations`);
  const relatedSeries = data.results;

  createSeries(relatedSeries, relatedMoviesContainer);
}

function getLikedSeries() {
  const likedSeries = likedSeriesList();
  const seriesArray = Object.values(likedSeries);

  createSeries(seriesArray, likedSeriesListArticle, { lazyLoad: true, clean: true });
}
// versión nueva
