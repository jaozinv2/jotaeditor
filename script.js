const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const folderInput = document.getElementById('folder-input');
const searchInput = document.getElementById('search-input');
const artistSelect = document.getElementById('artist-select');
const songListElement = document.getElementById('song-list');
const audioPlayer = document.getElementById('audio-player');

const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const coverArt = document.getElementById('cover-art');
const btnPlay = document.getElementById('btn-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnShuffle = document.getElementById('btn-shuffle');
const btnLoop = document.getElementById('btn-loop');
const btnMute = document.getElementById('btn-mute');
const btnFilterFav = document.getElementById('btn-filter-fav');
const btnExportFavs = document.getElementById('btn-export-favs');
const libraryStats = document.getElementById('library-stats');
const seekBar = document.getElementById('seek-bar');
const volumeBar = document.getElementById('volume-bar');
const speedSelect = document.getElementById('speed-select');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');
const glassContainer = document.querySelector('.glass-container');

// Elementos da Fila
const queueSection = document.getElementById('queue-section');
const queueListElement = document.getElementById('queue-list');
const queueCountEl = document.getElementById('queue-count');
const btnClearQueue = document.getElementById('btn-clear-queue');

// Elementos de Playlists
const playlistNameInput = document.getElementById('playlist-name-input');
const btnCreatePlaylist = document.getElementById('btn-create-playlist');
const playlistsContainer = document.getElementById('playlists-container');
const playlistDetailContainer = document.getElementById('playlist-detail-container');
const playlistsList = document.getElementById('playlists-list');
const playlistSongsList = document.getElementById('playlist-songs-list');
const btnBackPlaylists = document.getElementById('btn-back-playlists');
const btnPlayPlaylist = document.getElementById('btn-play-playlist');
const activePlaylistTitle = document.getElementById('active-playlist-title');

const btnThemeToggle = document.getElementById('btn-theme-toggle');
const wallpaperInput = document.getElementById('wallpaper-input');
const btnResetWallpaper = document.getElementById('btn-reset-wallpaper');

const jsMediatags = window.jsmediatags;
let songs = [];
let playlists = [];
let queue = [];
let currentSongIndex = -1;
let activePlaylistId = null;

let isShuffle = false;
let loopMode = 0;
let isFavFilterActive = false;
let isMuted = false;
let previousVolume = 1;

// --- ESTRUTURA DO INDEXEDDB ---
const DB_NAME = 'JotaPlayerDB';
const DB_VERSION = 2;
const STORE_SONGS = 'songs';
const STORE_PLAYLISTS = 'playlists';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_SONGS)) {
        db.createObjectStore(STORE_SONGS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_PLAYLISTS)) {
        db.createObjectStore(STORE_PLAYLISTS, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveSongToDB(songData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SONGS, 'readwrite');
    const store = tx.objectStore(STORE_SONGS);
    const req = store.add(songData);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getAllSongsFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SONGS, 'readonly');
    const store = tx.objectStore(STORE_SONGS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function updateSongInDB(songData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SONGS, 'readwrite');
    const store = tx.objectStore(STORE_SONGS);
    const { url, ...dataToSave } = songData;
    const req = store.put(dataToSave);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

async function clearSongsFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SONGS, 'readwrite');
    const store = tx.objectStore(STORE_SONGS);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

async function savePlaylistToDB(playlistData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PLAYLISTS, 'readwrite');
    const store = tx.objectStore(STORE_PLAYLISTS);
    const req = store.add(playlistData);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getAllPlaylistsFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PLAYLISTS, 'readonly');
    const store = tx.objectStore(STORE_PLAYLISTS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function updatePlaylistInDB(playlistData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PLAYLISTS, 'readwrite');
    const store = tx.objectStore(STORE_PLAYLISTS);
    const req = store.put(playlistData);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

async function deletePlaylistFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PLAYLISTS, 'readwrite');
    const store = tx.objectStore(STORE_PLAYLISTS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', async () => {
  const savedTheme = localStorage.getItem('app-theme');
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    btnThemeToggle.textContent = '🌙 Mudar para Escuro';
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    btnThemeToggle.textContent = '☀️ Mudar para Claro';
  }

  const savedWallpaper = localStorage.getItem('app-wallpaper');
  if (savedWallpaper) {
    document.body.style.backgroundImage = `url('${savedWallpaper}')`;
  }

  const savedSpeed = localStorage.getItem('app-speed');
  if (savedSpeed) {
    speedSelect.value = savedSpeed;
    audioPlayer.playbackRate = parseFloat(savedSpeed);
  }

  setupMediaSession();
  await loadSavedData();
});

async function loadSavedData() {
  try {
    const dbSongs = await getAllSongsFromDB();
    if (dbSongs && dbSongs.length > 0) {
      songs = dbSongs.map(item => ({
        ...item,
        url: URL.createObjectURL(item.fileBlob)
      }));
      updateArtistDropdown();
      renderSongList();
      updateLibraryStats();
    }

    const dbPlaylists = await getAllPlaylistsFromDB();
    if (dbPlaylists) {
      playlists = dbPlaylists;
      renderPlaylists();
    }
  } catch (err) {
    console.error('Erro ao carregar dados salvos:', err);
  }
}

function setupMediaSession() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => btnPlay.click());
    navigator.mediaSession.setActionHandler('pause', () => btnPlay.click());
    navigator.mediaSession.setActionHandler('previoustrack', () => btnPrev.click());
    navigator.mediaSession.setActionHandler('nexttrack', () => btnNext.click());
  }
}

function updateMediaSessionMetadata(song) {
  if ('mediaSession' in navigator && song) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'JotaPlayer',
      artwork: song.pictureUrl ? [{ src: song.pictureUrl, sizes: '512x512', type: 'image/png' }] : []
    });
  }
}

// --- ATALHOS DE TECLADO ---
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    return;
  }

  const key = e.key.toLowerCase();

  if (key === 'q' || key === 'e') {
    const tabs = Array.from(tabBtns);
    const activeIndex = tabs.findIndex(btn => btn.classList.contains('active'));
    let newIndex = activeIndex;
    
    if (key === 'q') {
      newIndex = activeIndex - 1;
      if (newIndex < 0) newIndex = tabs.length - 1;
    } else if (key === 'e') {
      newIndex = activeIndex + 1;
      if (newIndex >= tabs.length) newIndex = 0;
    }
    
    tabs[newIndex].click();
    e.preventDefault();
  }

  if (e.key === 'ArrowLeft') {
    btnPrev.click();
    e.preventDefault();
  } else if (e.key === 'ArrowRight') {
    btnNext.click();
    e.preventDefault();
  }

  if (e.code === 'Space' || e.key === ' ') {
    btnPlay.click();
    e.preventDefault();
  }
});

// Sistema de Abas
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Configurações
btnThemeToggle.addEventListener('click', () => {
  if (document.body.classList.contains('dark-theme')) {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    btnThemeToggle.textContent = '🌙 Mudar para Escuro';
    localStorage.setItem('app-theme', 'light');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    btnThemeToggle.textContent = '☀️ Mudar para Claro';
    localStorage.setItem('app-theme', 'dark');
  }
});

speedSelect.addEventListener('change', () => {
  const speed = parseFloat(speedSelect.value);
  audioPlayer.playbackRate = speed;
  localStorage.setItem('app-speed', speed);
});

wallpaperInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Image = e.target.result;
      document.body.style.backgroundImage = `url('${base64Image}')`;
      try {
        localStorage.setItem('app-wallpaper', base64Image);
      } catch (err) {
        console.warn('Imagem muito grande para salvar no localStorage.');
      }
    };
    reader.readAsDataURL(file);
  }
});

btnResetWallpaper.addEventListener('click', () => {
  document.body.style.backgroundImage = 'none';
  localStorage.removeItem('app-wallpaper');
});

btnExportFavs.addEventListener('click', () => {
  const favs = songs.filter(s => s.favorite);
  if (favs.length === 0) {
    alert('Nenhuma música marcada como favorita.');
    return;
  }

  let text = '=== MINHAS MÚSICAS FAVORITAS (JOTAPLAYER) ===\n\n';
  favs.forEach((s, i) => {
    text += `${i + 1}. ${s.title} - ${s.artist}\n`;
  });

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'favoritos_jotaplayer.txt';
  a.click();
  URL.revokeObjectURL(url);
});

// --- LÓGICA DE PLAYLISTS ---
btnCreatePlaylist.addEventListener('click', async () => {
  const name = playlistNameInput.value.trim();
  if (!name) return;

  const newPlaylist = { name, songIds: [] };
  try {
    const id = await savePlaylistToDB(newPlaylist);
    newPlaylist.id = id;
    playlists.push(newPlaylist);
    playlistNameInput.value = '';
    renderPlaylists();
  } catch (err) {
    console.error('Erro ao criar playlist:', err);
  }
});

function renderPlaylists() {
  playlistsList.innerHTML = '';
  if (playlists.length === 0) {
    playlistsList.innerHTML = '<li class="empty-msg">Nenhuma playlist criada.</li>';
    return;
  }

  playlists.forEach(pl => {
    const li = document.createElement('li');
    li.className = 'song-item';
    li.innerHTML = `
      <div class="song-info">
        <span class="title">📂 ${pl.name}</span>
        <span class="artist">${pl.songIds.length} ${pl.songIds.length === 1 ? 'música' : 'músicas'}</span>
      </div>
      <div class="item-actions">
        <button class="action-btn-small btn-del-pl" title="Excluir Playlist">🗑️</button>
      </div>
    `;

    li.querySelector('.btn-del-pl').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Deseja excluir a playlist "${pl.name}"?`)) {
        await deletePlaylistFromDB(pl.id);
        playlists = playlists.filter(p => p.id !== pl.id);
        if (activePlaylistId === pl.id) {
          showPlaylistsOverview();
        }
        renderPlaylists();
      }
    });

    li.addEventListener('click', () => {
      openPlaylistDetail(pl.id);
    });

    playlistsList.appendChild(li);
  });
}

function openPlaylistDetail(playlistId) {
  activePlaylistId = playlistId;
  const pl = playlists.find(p => p.id === playlistId);
  if (!pl) return;

  activePlaylistTitle.textContent = pl.name;
  playlistsContainer.style.display = 'none';
  playlistDetailContainer.style.display = 'block';

  playlistSongsList.innerHTML = '';
  if (pl.songIds.length === 0) {
    playlistSongsList.innerHTML = '<li class="empty-msg">Playlist vazia. Adicione músicas pela Biblioteca.</li>';
    return;
  }

  pl.songIds.forEach((songId) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const actualIndex = songs.indexOf(song);
    const li = document.createElement('li');
    li.className = 'song-item';
    if (actualIndex === currentSongIndex) {
      li.classList.add('active');
    }

    li.innerHTML = `
      <div class="song-info">
        <span class="title">${song.title}</span>
        <span class="artist">${song.artist}</span>
      </div>
      <div class="item-actions">
        <button class="action-btn-small btn-remove-pl" title="Remover da Playlist">❌</button>
      </div>
    `;

    li.querySelector('.btn-remove-pl').addEventListener('click', async (e) => {
      e.stopPropagation();
      pl.songIds = pl.songIds.filter(id => id !== songId);
      await updatePlaylistInDB(pl);
      openPlaylistDetail(playlistId);
      renderPlaylists();
    });

    li.addEventListener('click', () => {
      loadAndPlaySong(actualIndex);
    });

    playlistSongsList.appendChild(li);
  });
}

btnBackPlaylists.addEventListener('click', showPlaylistsOverview);

function showPlaylistsOverview() {
  activePlaylistId = null;
  playlistDetailContainer.style.display = 'none';
  playlistsContainer.style.display = 'block';
  renderPlaylists();
}

btnPlayPlaylist.addEventListener('click', () => {
  const pl = playlists.find(p => p.id === activePlaylistId);
  if (!pl || pl.songIds.length === 0) return;

  const firstSongId = pl.songIds[0];
  const firstSong = songs.find(s => s.id === firstSongId);
  if (!firstSong) return;

  const firstIndex = songs.indexOf(firstSong);
  queue = pl.songIds.slice(1).map(id => songs.indexOf(songs.find(s => s.id === id))).filter(idx => idx !== -1);
  loadAndPlaySong(firstIndex);
  renderQueue();
});

function showAddToPlaylistPrompt(songId) {
  if (playlists.length === 0) {
    alert('Crie pelo menos uma playlist na aba "Playlists" primeiro.');
    return;
  }

  const playlistNames = playlists.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
  const choice = prompt(`Escolha o número da playlist para adicionar:\n\n${playlistNames}`);
  const idx = parseInt(choice) - 1;

  if (!isNaN(idx) && playlists[idx]) {
    const pl = playlists[idx];
    if (!pl.songIds.includes(songId)) {
      pl.songIds.push(songId);
      updatePlaylistInDB(pl).then(() => {
        renderPlaylists();
        alert(`Música adicionada à playlist "${pl.name}"!`);
      });
    } else {
      alert('Esta música já está nessa playlist.');
    }
  }
}

// Importação de arquivos
folderInput.addEventListener('change', async (event) => {
  const files = Array.from(event.target.files);
  const audioFiles = files.filter(file => file.type.startsWith('audio/'));

  if (audioFiles.length === 0) return;

  await clearSongsFromDB();
  songs = [];
  queue = [];
  renderQueue();

  let loadedCount = 0;
  for (const file of audioFiles) {
    jsMediatags.read(file, {
      onSuccess: async function(tag) {
        const title = tag.tags.title || file.name.replace(/\.[^/.]+$/, "");
        const artist = tag.tags.artist || "Artista Desconhecido";
        
        let pictureUrl = null;
        if (tag.tags.picture) {
          const { data, format } = tag.tags.picture;
          let base64String = "";
          for (let i = 0; i < data.length; i++) {
            base64String += String.fromCharCode(data[i]);
          }
          pictureUrl = `data:${format};base64,${btoa(base64String)}`;
        }

        const songObj = {
          fileBlob: file,
          title,
          artist,
          pictureUrl,
          favorite: false,
          duration: 0
        };

        try {
          const id = await saveSongToDB(songObj);
          songObj.id = id;
        } catch (err) {
          console.error("Erro ao salvar no banco local:", err);
        }

        songObj.url = URL.createObjectURL(file);

        const tempAudio = new Audio(songObj.url);
        tempAudio.addEventListener('loadedmetadata', () => {
          songObj.duration = tempAudio.duration;
          updateLibraryStats();
        });

        songs.push(songObj);
        loadedCount++;
        if (loadedCount === audioFiles.length) {
          updateArtistDropdown();
          renderSongList();
          updateLibraryStats();
        }
      },
      onError: async function() {
        const title = file.name.replace(/\.[^/.]+$/, "");
        const songObj = {
          fileBlob: file,
          title,
          artist: "Artista Desconhecido",
          pictureUrl: null,
          favorite: false,
          duration: 0
        };

        try {
          const id = await saveSongToDB(songObj);
          songObj.id = id;
        } catch (err) {
          console.error("Erro ao salvar no banco local:", err);
        }

        songObj.url = URL.createObjectURL(file);

        const tempAudio = new Audio(songObj.url);
        tempAudio.addEventListener('loadedmetadata', () => {
          songObj.duration = tempAudio.duration;
          updateLibraryStats();
        });

        songs.push(songObj);
        loadedCount++;
        if (loadedCount === audioFiles.length) {
          updateArtistDropdown();
          renderSongList();
          updateLibraryStats();
        }
      }
    });
  }
});

function updateLibraryStats() {
  const count = songs.length;
  const totalSec = songs.reduce((acc, s) => acc + (isNaN(s.duration) ? 0 : s.duration), 0);
  libraryStats.textContent = `${count} ${count === 1 ? 'música' : 'músicas'} (${formatTime(totalSec)})`;
}

function updateArtistDropdown() {
  const artistSet = new Set();

  songs.forEach(song => {
    if (song.artist && song.artist !== "Artista Desconhecido") {
      const individualArtists = song.artist.split(/[,/\\&]|feat\.|ft\./i);
      individualArtists.forEach(name => {
        const cleanName = name.trim();
        if (cleanName.length > 0) {
          artistSet.add(cleanName);
        }
      });
    }
  });

  const sortedArtists = Array.from(artistSet).sort((a, b) => a.localeCompare(b));
  artistSelect.innerHTML = '<option value="">Todos os Artistas</option>';
  
  sortedArtists.forEach(artist => {
    const opt = document.createElement('option');
    opt.value = artist;
    opt.textContent = artist;
    artistSelect.appendChild(opt);
  });
}

function renderSongList() {
  const query = searchInput.value.toLowerCase().trim();
  const selectedArtist = artistSelect.value.toLowerCase().trim();
  songListElement.innerHTML = '';

  const filteredSongs = songs.map((song, originalIndex) => ({ song, originalIndex })).filter(({ song }) => {
    const matchesSearch = song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query);
    const matchesFav = isFavFilterActive ? song.favorite : true;
    const matchesArtist = selectedArtist ? song.artist.toLowerCase().includes(selectedArtist) : true;

    return matchesSearch && matchesFav && matchesArtist;
  });

  if (filteredSongs.length === 0) {
    songListElement.innerHTML = '<li class="empty-msg">Nenhuma música encontrada.</li>';
    return;
  }

  filteredSongs.forEach(({ song, originalIndex }) => {
    const li = document.createElement('li');
    li.className = 'song-item';
    if (originalIndex === currentSongIndex) {
      li.classList.add('active');
    }

    li.innerHTML = `
      <div class="song-info">
        <span class="title">${song.title}</span>
        <span class="artist">${song.artist}</span>
      </div>
      <div class="item-actions">
        <button class="action-btn-small btn-add-pl" title="Adicionar à Playlist">📁</button>
        <button class="action-btn-small btn-add-queue" title="Adicionar à Fila">➕</button>
        <button class="action-btn-small btn-fav" title="Favoritar">${song.favorite ? '❤️' : '🤍'}</button>
      </div>
    `;

    li.querySelector('.btn-fav').addEventListener('click', async (e) => {
      e.stopPropagation();
      song.favorite = !song.favorite;
      await updateSongInDB(song);
      renderSongList();
    });

    li.querySelector('.btn-add-queue').addEventListener('click', (e) => {
      e.stopPropagation();
      queue.push(originalIndex);
      renderQueue();
    });

    li.querySelector('.btn-add-pl').addEventListener('click', (e) => {
      e.stopPropagation();
      showAddToPlaylistPrompt(song.id);
    });

    li.addEventListener('click', () => {
      loadAndPlaySong(originalIndex);
    });

    songListElement.appendChild(li);
  });
}

function renderQueue() {
  if (queue.length === 0) {
    queueSection.style.display = 'none';
    return;
  }

  queueSection.style.display = 'block';
  queueCountEl.textContent = queue.length;
  queueListElement.innerHTML = '';

  queue.forEach((songIdx, qIdx) => {
    const song = songs[songIdx];
    const li = document.createElement('li');
    li.className = 'queue-item';
    li.innerHTML = `
      <span>${song.title}</span>
      <button class="btn-text">❌</button>
    `;

    li.querySelector('button').addEventListener('click', () => {
      queue.splice(qIdx, 1);
      renderQueue();
    });

    queueListElement.appendChild(li);
  });
}

btnClearQueue.addEventListener('click', () => {
  queue = [];
  renderQueue();
});

searchInput.addEventListener('input', renderSongList);
artistSelect.addEventListener('change', renderSongList);

btnFilterFav.addEventListener('click', () => {
  isFavFilterActive = !isFavFilterActive;
  btnFilterFav.classList.toggle('active-filter', isFavFilterActive);
  btnFilterFav.textContent = isFavFilterActive ? '❤️' : '🤍';
  renderSongList();
});

btnShuffle.addEventListener('click', () => {
  isShuffle = !isShuffle;
  btnShuffle.classList.toggle('active', isShuffle);
});

btnLoop.addEventListener('click', () => {
  loopMode = (loopMode + 1) % 3;
  if (loopMode === 0) {
    btnLoop.textContent = '🔁';
    btnLoop.classList.remove('active');
  } else if (loopMode === 1) {
    btnLoop.textContent = '🔁';
    btnLoop.classList.add('active');
  } else if (loopMode === 2) {
    btnLoop.textContent = '🔂';
    btnLoop.classList.add('active');
  }
});

btnMute.addEventListener('click', () => {
  if (!isMuted) {
    previousVolume = audioPlayer.volume;
    audioPlayer.volume = 0;
    volumeBar.value = 0;
    isMuted = true;
    btnMute.textContent = '🔇';
  } else {
    audioPlayer.volume = previousVolume;
    volumeBar.value = previousVolume * 100;
    isMuted = false;
    btnMute.textContent = '🔊';
  }
});

function loadAndPlaySong(index) {
  if (index < 0 || index >= songs.length) return;

  currentSongIndex = index;
  const song = songs[index];

  playerTitle.textContent = song.title;
  playerArtist.textContent = song.artist;

  if (song.pictureUrl) {
    coverArt.style.backgroundImage = `url(${song.pictureUrl})`;
    coverArt.innerHTML = '';
  } else {
    coverArt.style.backgroundImage = 'none';
    coverArt.innerHTML = '<span class="cover-placeholder">🎵</span>';
  }

  updateMediaSessionMetadata(song);
  renderSongList();
  if (activePlaylistId) {
    openPlaylistDetail(activePlaylistId);
  }

  audioPlayer.src = song.url;
  audioPlayer.playbackRate = parseFloat(speedSelect.value);
  audioPlayer.volume = volumeBar.value / 100;
  audioPlayer.play();
  btnPlay.textContent = '⏸';
  glassContainer.classList.add('playing');
}

btnPlay.addEventListener('click', () => {
  if (currentSongIndex === -1 && songs.length > 0) {
    loadAndPlaySong(0);
    return;
  }

  if (audioPlayer.paused) {
    audioPlayer.play();
    btnPlay.textContent = '⏸';
    glassContainer.classList.add('playing');
  } else {
    audioPlayer.pause();
    btnPlay.textContent = '▶';
    glassContainer.classList.remove('playing');
  }
});

function getNextIndex() {
  if (queue.length > 0) {
    const nextIdx = queue.shift();
    renderQueue();
    return nextIdx;
  }

  if (isShuffle) {
    let rand = Math.floor(Math.random() * songs.length);
    if (rand === currentSongIndex && songs.length > 1) {
      rand = (rand + 1) % songs.length;
    }
    return rand;
  }

  return (currentSongIndex + 1) % songs.length;
}

btnNext.addEventListener('click', () => {
  if (songs.length === 0) return;
  loadAndPlaySong(getNextIndex());
});

btnPrev.addEventListener('click', () => {
  if (songs.length === 0) return;
  const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadAndPlaySong(prevIndex);
});

audioPlayer.addEventListener('timeupdate', () => {
  if (!isNaN(audioPlayer.duration)) {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    seekBar.value = progress;

    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    durationTimeEl.textContent = formatTime(audioPlayer.duration);
  }
});

seekBar.addEventListener('input', () => {
  if (!isNaN(audioPlayer.duration)) {
    audioPlayer.currentTime = (seekBar.value / 100) * audioPlayer.duration;
  }
});

volumeBar.addEventListener('input', () => {
  const vol = volumeBar.value / 100;
  audioPlayer.volume = vol;
  if (vol > 0) {
    isMuted = false;
    btnMute.textContent = '🔊';
  }
});

audioPlayer.addEventListener('ended', () => {
  if (loopMode === 2) {
    audioPlayer.currentTime = 0;
    audioPlayer.play();
  } else if (loopMode === 1 || isShuffle || queue.length > 0 || currentSongIndex < songs.length - 1) {
    btnNext.click();
  } else {
    btnPlay.textContent = '▶';
    glassContainer.classList.remove('playing');
  }
});

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}
