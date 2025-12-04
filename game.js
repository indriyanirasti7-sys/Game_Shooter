// Mendapatkan elemen canvas dan konteks
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Variabel game
let score = 0;
let lives = 3;
let level = 1;
let ammo = 30;
let gameRunning = true;
let gamePaused = false;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let stars = [];
let explosions = [];
let enemySpeed = 1.5;
let enemySpawnRate = 100; // frame
let enemyShootRate = 120; // frame
let enemyShootCounter = 0;
let enemySpawnCounter = 0;
let enemiesKilled = 0;
let enemiesToNextLevel = 5;
let reloadCooldown = 0;
let playerHealth = 100;
let maxPlayerHealth = 100;
let healthRegenCooldown = 0;
let isGameOver = false;

// Karakter utama (pemain) - SEGITIGA di BAGIAN BAWAH
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80, // Posisi di bagian bawah
    width: 40,
    height: 40,
    speed: 5,
    color: '#4fc3f7',
    moveLeft: false,
    moveRight: false
};

// Membuat bintang untuk background
function createStars() {
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.5 + 0.5
        });
    }
}

// Inisialisasi game
function init() {
    score = 0;
    lives = 3;
    level = 1;
    ammo = 30;
    gameRunning = true;
    gamePaused = false;
    isGameOver = false;
    enemies = [];
    bullets = [];
    enemyBullets = [];
    explosions = [];
    enemySpeed = 1.5;
    enemySpawnRate = 100;
    enemyShootRate = 120;
    enemiesKilled = 0;
    enemiesToNextLevel = 5;
    reloadCooldown = 0;
    playerHealth = 100;
    maxPlayerHealth = 100;
    healthRegenCooldown = 0;
    
    // Posisi pemain di tengah bawah
    player.x = canvas.width / 2;
    player.y = canvas.height - 80;
    
    createStars();
    updateUI();
    updateHealthBar();
    
    // Sembunyikan pesan game over
    document.getElementById('gameOverMessage').style.display = 'none';
    document.getElementById('levelUpMessage').style.display = 'none';
}

// Update tampilan UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
    document.getElementById('ammo').textContent = ammo;
}

// Update health bar
function updateHealthBar() {
    const healthFill = document.getElementById('healthFill');
    const healthValue = document.getElementById('healthValue');
    const healthPercent = (playerHealth / maxPlayerHealth) * 100;
    
    healthFill.style.width = `${healthPercent}%`;
    healthValue.textContent = `${Math.round(healthPercent)}%`;
    
    // Ubah warna berdasarkan kesehatan
    if (healthPercent > 70) {
        healthFill.style.background = 'linear-gradient(to right, #4CAF50, #8BC34A)';
        healthValue.style.color = '#4CAF50';
    } else if (healthPercent > 30) {
        healthFill.style.background = 'linear-gradient(to right, #FFC107, #FF9800)';
        healthValue.style.color = '#FFC107';
    } else {
        healthFill.style.background = 'linear-gradient(to right, #F44336, #FF5722)';
        healthValue.style.color = '#F44336';
    }
    
    // Tambah animasi damage
    if (healthPercent < 100) {
        healthFill.classList.add('health-damage');
        setTimeout(() => {
            healthFill.classList.remove('health-damage');
        }, 500);
    }
}

// Gambar pemain (segitiga biru) menghadap ke ATAS
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Gambar segitiga menghadap ke atas
    ctx.beginPath();
    ctx.moveTo(0, -player.height / 2); // Puncak segitiga
    ctx.lineTo(player.width / 2, player.height / 2); // Kanan bawah
    ctx.lineTo(-player.width / 2, player.height / 2); // Kiri bawah
    ctx.closePath();
    
    // Warna biru dengan gradien berdasarkan kesehatan
    let gradient;
    if (playerHealth > 70) {
        gradient = ctx.createLinearGradient(0, -player.height / 2, 0, player.height / 2);
        gradient.addColorStop(0, player.color);
        gradient.addColorStop(1, '#0277bd');
    } else if (playerHealth > 30) {
        gradient = ctx.createLinearGradient(0, -player.height / 2, 0, player.height / 2);
        gradient.addColorStop(0, '#FFC107');
        gradient.addColorStop(1, '#FF9800');
    } else {
        gradient = ctx.createLinearGradient(0, -player.height / 2, 0, player.height / 2);
        gradient.addColorStop(0, '#F44336');
        gradient.addColorStop(1, '#D32F2F');
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Outline
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    
    // Efek cahaya berdasarkan kesehatan
    ctx.beginPath();
    ctx.arc(0, 0, player.width / 3, 0, Math.PI * 2);
    const opacity = playerHealth > 30 ? 0.3 : 0.6; // Lebih terang saat kesehatan rendah
    ctx.fillStyle = playerHealth > 70 ? 'rgba(79, 195, 247, 0.3)' : 
                    playerHealth > 30 ? 'rgba(255, 193, 7, 0.3)' : 
                    'rgba(244, 67, 54, 0.6)';
    ctx.fill();
    
    // Gambar "mesin" pemain
    ctx.fillStyle = playerHealth > 30 ? '#ff9800' : '#ff5252';
    ctx.beginPath();
    ctx.arc(-player.width / 4, player.height / 3, player.width / 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(player.width / 4, player.height / 3, player.width / 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Gambar musuh (segilima ungu) - muncul dari ATAS ke BAWAH
function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    
    // Gambar segilima
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) + Math.PI / 2; // Putar agar menghadap ke bawah
        const x = Math.cos(angle) * enemy.size;
        const y = Math.sin(angle) * enemy.size;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    
    // Warna ungu dengan gradien
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.size);
    gradient.addColorStop(0, '#ab47bc');
    gradient.addColorStop(1, '#6a1b9a');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Outline
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    
    // Mata musuh (menghadap ke bawah)
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(-enemy.size / 3, enemy.size / 4, enemy.size / 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(enemy.size / 3, enemy.size / 4, enemy.size / 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupil
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-enemy.size / 3, enemy.size / 4, enemy.size / 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(enemy.size / 3, enemy.size / 4, enemy.size / 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Mulut (semakin lebar saat semakin dekat ke pemain)
    const smileSize = enemy.size / 3;
    ctx.beginPath();
    ctx.arc(0, enemy.size / 2, smileSize, 0, Math.PI, false);
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
}

// Gambar peluru (lingkaran merah)
function drawBullet(bullet) {
    ctx.save();
    
    // Efek cahaya peluru
    const gradient = ctx.createRadialGradient(
        bullet.x, bullet.y, 0,
        bullet.x, bullet.y, bullet.radius * 2
    );
    gradient.addColorStop(0, '#ff5252');
    gradient.addColorStop(0.7, '#ff1744');
    gradient.addColorStop(1, 'rgba(255, 23, 68, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Peluru utama
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Gambar peluru musuh (lingkaran ungu)
function drawEnemyBullet(bullet) {
    ctx.save();
    
    // Efek cahaya peluru
    const gradient = ctx.createRadialGradient(
        bullet.x, bullet.y, 0,
        bullet.x, bullet.y, bullet.radius * 2
    );
    gradient.addColorStop(0, '#ab47bc');
    gradient.addColorStop(0.7, '#8e24aa');
    gradient.addColorStop(1, 'rgba(142, 36, 170, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Peluru utama
    ctx.fillStyle = '#8e24aa';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Gambar ledakan
function drawExplosion(explosion) {
    ctx.save();
    ctx.globalAlpha = explosion.opacity;
    
    // Gambar ledakan sebagai lingkaran dengan gradien
    const gradient = ctx.createRadialGradient(
        explosion.x, explosion.y, 0,
        explosion.x, explosion.y, explosion.radius
    );
    gradient.addColorStop(0, explosion.color === '#ffeb3b' ? '#ffeb3b' : '#ff9800');
    gradient.addColorStop(0.5, explosion.color === '#ffeb3b' ? '#ff9800' : '#ff5252');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Gambar background bintang
function drawBackground() {
    // Background gelap
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gambar bintang
    stars.forEach(star => {
        // Update posisi bintang (efek parallax)
        star.x -= star.speed;
        if (star.x < 0) {
            star.x = canvas.width;
            star.y = Math.random() * canvas.height;
        }
        
        // Gambar bintang
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Buat musuh baru - MUNCUL dari ATAS ke BAWAH
function createEnemy() {
    const size = 30 + Math.random() * 10;
    const startX = 50 + Math.random() * (canvas.width - 100); // Posisi acak di bagian atas
    
    enemies.push({
        x: startX,
        y: -50, // Mulai dari atas layar
        size: size,
        speedX: (Math.random() - 0.5) * 1.5, // Gerak horizontal acak
        speedY: enemySpeed + Math.random() * 0.5, // Bergerak ke bawah
        health: 1,
        damage: 15 // Damage yang diberikan saat menyentuh pemain
    });
}

// Tembak peluru dari pemain (ke ATAS)
function shootBullet() {
    if (ammo <= 0) {
        // Tidak ada amunisi
        createExplosion(player.x, player.y - player.height / 2, 10, '#ff9800');
        return;
    }
    
    bullets.push({
        x: player.x,
        y: player.y - player.height / 2, // Dari ujung segitiga
        radius: 5,
        speed: -8, // Ke atas (negatif)
        color: '#ff1744'
    });
    
    ammo--;
    updateUI();
    
    // Efek visual saat menembak
    createExplosion(player.x, player.y - player.height / 2, 15, '#4fc3f7');
    
    // Efek suara (jika browser mendukung)
    playShootSound();
}

// Musuh menembak (ke BAWAH)
function enemyShoot(enemy) {
    enemyBullets.push({
        x: enemy.x,
        y: enemy.y + enemy.size, // Dari bawah musuh
        radius: 4,
        speed: 5, // Ke bawah (positif)
        color: '#ab47bc',
        damage: 10 // Damage peluru musuh
    });
    
    // Efek visual saat musuh menembak
    createExplosion(enemy.x, enemy.y + enemy.size, 10, '#ab47bc');
}

// Buat efek ledakan
function createExplosion(x, y, radius, color) {
    explosions.push({
        x: x,
        y: y,
        radius: radius,
        maxRadius: radius * 3,
        opacity: 1,
        color: color
    });
}

// Deteksi tabrakan
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Deteksi tabrakan lingkaran dengan persegi panjang
function checkCircleRectCollision(circle, rect) {
    // Temukan titik terdekat pada persegi panjang ke lingkaran
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    // Hitung jarak dari titik terdekat ke pusat lingkaran
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    
    // Jika jarak kurang dari radius lingkaran, maka terjadi tabrakan
    return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
}

// Player mengambil damage
function takeDamage(damageAmount) {
    playerHealth -= damageAmount;
    if (playerHealth < 0) playerHealth = 0;
    
    updateHealthBar();
    
    // Reset regen cooldown
    healthRegenCooldown = 300; // 5 detik (60 FPS * 5)
    
    // Efek visual
    createExplosion(player.x, player.y, 25, '#ff5252');
    
    // Efek suara (jika browser mendukung)
    playDamageSound();
    
    // Cek apakah pemain mati
    if (playerHealth <= 0) {
        playerHealth = 0;
        gameOver();
    }
}

// Update logika game
function update() {
    if (!gameRunning || gamePaused || isGameOver) return;
    
    // Update pemain
    if (player.moveLeft && player.x > player.width / 2) {
        player.x -= player.speed;
    }
    if (player.moveRight && player.x < canvas.width - player.width / 2) {
        player.x += player.speed;
    }
    
    // Regenerasi kesehatan
    if (healthRegenCooldown > 0) {
        healthRegenCooldown--;
    } else if (playerHealth < maxPlayerHealth) {
        playerHealth += 0.5; // Regenerasi lambat
        if (playerHealth > maxPlayerHealth) playerHealth = maxPlayerHealth;
        updateHealthBar();
    }
    
    // Update peluru pemain (bergerak ke ATAS)
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y += bullets[i].speed;
        
        // Hapus peluru jika keluar layar (atas)
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Cek tabrakan dengan musuh
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const bulletRect = {
                x: bullets[i].x - bullets[i].radius,
                y: bullets[i].y - bullets[i].radius,
                width: bullets[i].radius * 2,
                height: bullets[i].radius * 2
            };
            
            const enemyRect = {
                x: enemy.x - enemy.size,
                y: enemy.y - enemy.size,
                width: enemy.size * 2,
                height: enemy.size * 2
            };
            
            if (checkCollision(bulletRect, enemyRect)) {
                // Musuh terkena tembakan
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                
                // Tambah skor
                score += 10 * level;
                enemiesKilled++;
                
                // Buat efek ledakan
                createExplosion(enemy.x, enemy.y, 20, '#ffeb3b');
                
                // Efek suara (jika browser mendukung)
                playHitSound();
                
                // Cek jika sudah mencapai target untuk naik level
                if (enemiesKilled >= enemiesToNextLevel) {
                    levelUp();
                }
                
                updateUI();
                break;
            }
        }
    }
    
    // Update peluru musuh (bergerak ke BAWAH)
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        
        // Hapus peluru jika keluar layar (bawah)
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
        }
        
        // Cek tabrakan dengan pemain
        const bullet = enemyBullets[i];
        const playerRect = {
            x: player.x - player.width / 2,
            y: player.y - player.height / 2,
            width: player.width,
            height: player.height
        };
        
        if (checkCircleRectCollision(bullet, playerRect)) {
            // Pemain terkena tembakan
            enemyBullets.splice(i, 1);
            takeDamage(bullet.damage);
            
            // Cek game over
            if (playerHealth <= 0) {
                gameOver();
            }
        }
    }
    
    // Update musuh (bergerak dari ATAS ke BAWAH)
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.x += enemy.speedX;
        enemy.y += enemy.speedY;
        
        // Pantulkan musuh jika mencapai batas kiri/kanan
        if (enemy.x < enemy.size || enemy.x > canvas.width - enemy.size) {
            enemy.speedX = -enemy.speedX;
        }
        
        // Hapus musuh jika keluar layar (bawah)
        if (enemy.y > canvas.height + 50) {
            enemies.splice(i, 1);
        }
        
        // Cek tabrakan dengan pemain (SEGILIMA MENYENTUH SEGITIGA)
        const enemyRect = {
            x: enemy.x - enemy.size,
            y: enemy.y - enemy.size,
            width: enemy.size * 2,
            height: enemy.size * 2
        };
        
        const playerRect = {
            x: player.x - player.width / 2,
            y: player.y - player.height / 2,
            width: player.width,
            height: player.height
        };
        
        if (checkCollision(enemyRect, playerRect)) {
            // Tabrakan dengan pemain - SEGILIMA MENYENTUH SEGITIGA
            enemies.splice(i, 1);
            takeDamage(enemy.damage);
            
            // Buat efek ledakan besar
            createExplosion(enemy.x, enemy.y, 40, '#ff5252');
            
            // Cek game over
            if (playerHealth <= 0) {
                gameOver();
            }
        }
    }
    
    // Update ledakan
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].radius += 1;
        explosions[i].opacity -= 0.03;
        
        // Hapus ledakan jika sudah memudar
        if (explosions[i].opacity <= 0 || explosions[i].radius > explosions[i].maxRadius) {
            explosions.splice(i, 1);
        }
    }
    
    // Spawn musuh baru
    enemySpawnCounter++;
    if (enemySpawnCounter >= enemySpawnRate) {
        createEnemy();
        enemySpawnCounter = 0;
        
        // Kurangi spawn rate sedikit untuk meningkatkan kesulitan
        enemySpawnRate = Math.max(30, enemySpawnRate - 1);
    }
    
    // Musuh menembak
    enemyShootCounter++;
    if (enemyShootCounter >= enemyShootRate && enemies.length > 0) {
        // Pilih musuh acak untuk menembak
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        enemyShoot(randomEnemy);
        enemyShootCounter = 0;
        
        // Kurangi shoot rate sedikit untuk meningkatkan kesulitan
        enemyShootRate = Math.max(60, enemyShootRate - 1);
    }
    
    // Update cooldown reload
    if (reloadCooldown > 0) {
        reloadCooldown--;
    }
}

// Naik level
function levelUp() {
    level++;
    enemiesKilled = 0;
    enemiesToNextLevel = 5 * level;
    
    // Tingkatkan kesulitan
    enemySpeed += 0.3;
    
    // Isi ulang amunisi
    ammo = 30 + level * 5;
    
    // Pulihkan kesehatan sebagian
    playerHealth = Math.min(maxPlayerHealth, playerHealth + 30);
    updateHealthBar();
    
    // Tampilkan pesan level up
    document.getElementById('newLevel').textContent = level;
    document.getElementById('levelUpMessage').style.display = 'block';
    gamePaused = true;
    
    updateUI();
}

// Game over
function gameOver() {
    isGameOver = true;
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('gameOverMessage').style.display = 'block';
    
    // Efek suara game over (jika browser mendukung)
    playGameOverSound();
}

// Restart game
function restartGame() {
    init();
    document.getElementById('gameOverMessage').style.display = 'none';
}

// Quit game - kembali ke halaman utama
function quitGame() {
    // Sembunyikan game over message
    document.getElementById('gameOverMessage').style.display = 'none';
    
    // Tampilkan halaman utama sederhana
    const gameContainer = document.querySelector('.game-container');
    gameContainer.innerHTML = `
        <div class="home-page">
            <h1 class="home-title">SPACE SHOOTER</h1>
            <div class="home-stats">
                <h2>Statistik Permainan Terakhir:</h2>
                <p>Skor: <span class="stat-value">${score}</span></p>
                <p>Level Tertinggi: <span class="stat-value">${level}</span></p>
                <p>Musuh Dikalahkan: <span class="stat-value">${enemiesKilled}</span></p>
            </div>
            <div class="home-buttons">
                <button class="home-btn play" onclick="location.reload()">MAIN LAGI</button>
                <button class="home-btn quit" onclick="closeGame()">KELUAR GAME</button>
            </div>
        </div>
    `;
}

// Fungsi untuk menutup game (simulasi)
function closeGame() {
    document.querySelector('.game-container').innerHTML = `
        <div class="home-page">
            <h1 class="home-title">SPACE SHOOTER</h1>
            <p style="font-size: 24px; margin: 40px 0;">Terima kasih telah bermain!</p>
            <p style="margin-bottom: 30px;">Game telah ditutup.</p>
            <button class="home-btn play" onclick="location.reload()">MAIN LAGI</button>
        </div>
    `;
}

// Lanjutkan setelah level up
function continueGame() {
    document.getElementById('levelUpMessage').style.display = 'none';
    gamePaused = false;
}

// Isi ulang amunisi
function reloadAmmo() {
    if (reloadCooldown <= 0) {
        ammo = 30 + level * 5;
        reloadCooldown = 180; // 3 detik (60 FPS * 3)
        updateUI();
        
        // Efek visual
        createExplosion(player.x, player.y, 20, '#4fc3f7');
    }
}

// Fungsi untuk memainkan suara tembakan
function playShootSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Browser tidak mendukung Web Audio API
        console.log("Browser tidak mendukung efek suara");
    }
}

// Fungsi untuk memainkan suara tabrakan
function playHitSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 300;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        // Browser tidak mendukung Web Audio API
        console.log("Browser tidak mendukung efek suara");
    }
}

// Fungsi untuk memainkan suara damage
function playDamageSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 150;
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Browser tidak mendukung Web Audio API
        console.log("Browser tidak mendukung efek suara");
    }
}

// Fungsi untuk memainkan suara game over
function playGameOverSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Buat dua oscillator untuk suara yang lebih kompleks
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.frequency.value = 200;
        oscillator2.frequency.value = 150;
        oscillator1.type = 'sine';
        oscillator2.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 1);
        oscillator2.stop(audioContext.currentTime + 1);
    } catch (e) {
        // Browser tidak mendukung Web Audio API
        console.log("Browser tidak mendukung efek suara");
    }
}

// Gambar semua objek
function draw() {
    // Gambar background
    drawBackground();
    
    // Gambar peluru musuh
    enemyBullets.forEach(bullet => drawEnemyBullet(bullet));
    
    // Gambar musuh
    enemies.forEach(enemy => drawEnemy(enemy));
    
    // Gambar peluru pemain
    bullets.forEach(bullet => drawBullet(bullet));
    
    // Gambar pemain
    drawPlayer();
    
    // Gambar ledakan
    explosions.forEach(explosion => drawExplosion(explosion));
    
    // Gambar indikator reload
    if (reloadCooldown > 0) {
        const reloadPercent = reloadCooldown / 180;
        const barWidth = 100;
        const barHeight = 10;
        const barX = canvas.width - barWidth - 20;
        const barY = 20;
        
        // Background bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Reload bar
        ctx.fillStyle = reloadCooldown > 0 ? '#ff9800' : '#4caf50';
        ctx.fillRect(barX, barY, barWidth * (1 - reloadPercent), barHeight);
        
        // Outline
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('RELOADING', barX, barY - 5);
    }
    
    // Gambar indikator kesehatan di atas pemain
    if (playerHealth < maxPlayerHealth) {
        const healthBarWidth = 50;
        const healthBarHeight = 6;
        const healthBarX = player.x - healthBarWidth / 2;
        const healthBarY = player.y - player.height;
        
        // Background bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health bar
        const healthPercent = playerHealth / maxPlayerHealth;
        ctx.fillStyle = healthPercent > 0.7 ? '#4CAF50' : 
                        healthPercent > 0.3 ? '#FFC107' : 
                        '#F44336';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
        
        // Outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    }
    
    // Gambar indikator game paused
    if (gamePaused && gameRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '24px Arial';
        ctx.fillText('Tekan P untuk melanjutkan', canvas.width / 2, canvas.height / 2 + 50);
    }
}

// Loop game utama
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listener untuk keyboard
document.addEventListener('keydown', (e) => {
    if (!gameRunning || isGameOver) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            player.moveLeft = true;
            break;
        case 'ArrowRight':
            player.moveRight = true;
            break;
        case ' ':
            if (!gamePaused) shootBullet();
            e.preventDefault(); // Mencegah scroll halaman
            break;
        case 'r':
        case 'R':
            if (!gamePaused) reloadAmmo();
            break;
        case 'p':
        case 'P':
            gamePaused = !gamePaused;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            player.moveLeft = false;
            break;
        case 'ArrowRight':
            player.moveRight = false;
            break;
    }
});

// Inisialisasi dan mulai game
init();
gameLoop();