/*
*1. Render songs - HTML Reference (check)
*2. Scroll top
*3. Play / pause / seek
*4. CD rotate - Animation API (nên console log ra xem)
*5. Next / prev
*6. Random
*7. Next / Repeat when ended
*8. Active song
*9. Scroll active song into view - Phương thức (sroll into view)
*10. Play song  when clicked
*/

const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const PLAYER_STORAGE_KEY = 'F8_PLAYER'

// Chúng ta đem biến truy xuất ra ngoài để có thể test bằng console được 
const heading = $('header h2');
const cdThumb = $('.cd-thumb');
const audio = $('#audio');
const cd = $('.cd');
const playBtn = $('.btn-toggle-play');
const player = $('.player');
const progress = $('#progress');
const nextBtn = $('.btn-next')
const prevBtn = $('.btn-prev')
const randomBtn = $('.btn-random')
const repeatBtn = $('.btn-repeat')
const playlist = $('.playlist')

const app = {
    // currentIndex = 0 là mục đính ta lấy index: 0 của mảng để xử lý
     currentIndex: 0,
     // Đặt flag, những gì có hoặc không ta tư duy theo kiểu boolean
     isPlaying: false,
     isRandom: false,
     isRepeat: false,
     config: JSON.parse(localStorage.getItem('PLAYER_STORAGE_KEY')) || {},
    songs: [
    {
        name: 'Niji ナルト 疾風伝',
        singer: 'Shinku Horous',
        path: './assets/musics/song10.mp3',
        image: './assets/img/song10.png'
    },
    {
        name: 'Ichiban Boshi',
        singer: 'Gokukoku no Brynhildr',
        path: './assets/musics/song9.mp3',
        image: './assets/img/song9.png'
    },
    {
        name: 'Daisy',
        singer: 'STEREO DIVE FOUNDATION',
        path: './assets/musics/song8.mp3',
        image: './assets/img/song8.png'
    },
    {
        name: 'Thurisaz',
        singer: 'Kingyo',
        path: './assets/musics/song7.mp3',
        image: './assets/img/song7.png'
    },
    {
        name: 'Redo',
        singer: '平間美賀',
        path: './assets/musics/song6.mp3',
        image: './assets/img/song6.png'
    },
    {
        name: 'Eihwaz',
        singer: 'Kingyo',
        path: './assets/musics/song5.mp3',
        image: './assets/img/song5.png'
    },
    {
        name: 'Wishing',
        singer: 'Inori Minase',
        path: './assets/musics/song4.mp3',
        image: './assets/img/song4.png'
    },
    {
        name: 'Wolfdog (Old) Guro Station (Town)',
        singer: 'Closers Online OST',
        path: './assets/musics/song3.mp3',
        image: './assets/img/song3.png'
    },
    {
        name: 'Stay Alive',
        singer: 'Rie Takahashi',
        path: './assets/musics/song2.mp3',
        image: './assets/img/song2.png'
    },
    {
        name: 'Mirror',
        singer: 'Rei Yasuda',
        path: './assets/musics/song1.mp3',
        image: './assets/img/song1.png'
    },],
    setConfig: function(key, value) {
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config))
     },
    // Render view
    render: function () {
        const htmls = this.songs.map((song, index) => {
            return `
                <div class="song ${index === this.currentIndex ? 'active': ''}" data-index="${index}">
                    <div class="thumb" style="background-image: url('${song.image}')">
                    </div>
                    <div class="body">
                        <h3 class="title">${song.name}</h3>
                        <p class="author">${song.singer}</p>
                    </div>
                    <div class="option">
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                </div>
            `
        })
        // Vì không gọi lại nhiều lần nên ta không cần đặt biến
        playlist.innerHTML = htmls.join('');
    },
    // Định nghĩa ra các thuộc tính
    defineProperties: function () {
        // Getter dữ liệu, cần xem lại đoạn này
        Object.defineProperty(this, 'currentSong', {
            get: function() {
                return this.songs[this.currentIndex];
            }
        })
    },

    // Xử lý sự kiện có trong trang
    handleEvents: function () {
        // Lấy ra kích thước của (.cd) và width của nó
        const cdWidth = cd.offsetWidth

        // Lưu biến this bên ngoài handleEvents vào _this để các thuộc tínhm, phương thức bên trong
        // có thể sử dụng
        const _this = this;

        // Xử lý CD quay / dừng
        // Trả về obj là animate
        const cdThumbAnimate = cdThumb.animate([
            { transform: 'rotate(360deg)' }
        ], {
            duration: 10000, // 10 seconds
            iterations: Infinity // vô hạn
        })
        cdThumbAnimate.pause();

        // Xử lý phóng to  / thu nhỏ CD
        document.onscroll = function () {
            // Lấy ra toạ độ khi scroll từ chiều dọc nó trả ra pixels tại vị trí chúng ta kéo
            // Ở 1 số trình duyệt nó sẽ không hoạt động nên chúng ta có thể sử dụng
            // scrolldocument.documentElement.scrollTop thay cho window.scrollY
            const scrollTop = window.scrollY || document.documentElement.scrollTop
            
            // Chúng ta có thể tính toán dựa trên thông số khi chúng ta scroll (Kéo lên là tăng phạm vi và ngược lại)
            // Vì cái image đã được set padding-top để avatar có thể scale theo hình vuông
            // Do đó chúng ta chỉ cần giảm width của thẻ chứa avatar(.cd) là height nó tự giảm theo
            // => Khi chúng ta cuộn lên thì kích thước của thằng cd giảm về 0
            const newCdWidth = cdWidth - scrollTop
            
            // Có được giá trị sau khi tính thì ta set ngược vào width của (.cd)
            // Nên khi kéo nó tự tính toán
            // Khi chúng ta kéo sẽ xãy ra trường hợp kéo nhanh nên thông số của scrollTop sẽ lớn và 
            // giá trị newCdWidth nhận được là giá trị âm nên chúng ta phải đưa nó vào check
            cd.style.width = newCdWidth > 0 ? newCdWidth + 'px': 0;

            // Thêm opacity cho avatar
            // Tính tỷ lệ: Ta có Opacity có giá trị nhận (0, 0.1, ..., 1) nên
            // Opacity = giá trị mới của width / giá trị ban đầu của width
            cd.style.opacity = newCdWidth / cdWidth;
               
        }

        // Xử lý khi click play
        playBtn.onclick = function() {
            // Lấy thẻ audio vừa get
            // Trường hợp đặc biệt: ở đây chúng ta không thể sử dụng trực tiếp this,
            // vì this ở bên ngoài trỏ tới object app còn trong sự kiện này nó nằm ở phương thức khác của element
            // nên this sẽ trả lại playBtn do đó ta có thể khai báo 1 bién bên ngoài scope để trỏ tới this
            // Xử lý logic
            if (_this.isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        }

        // Xử lý trạng thái
        // Khi song được play thì lắng nghe event
        audio.onplay = function() {
            _this.isPlaying = true
            player.classList.add('playing')
            cdThumbAnimate.play(); // Cùng lúc play thì cdThumb cũng quay
        }

        // Khi song bị pause thì lắng nghe event
        audio.onpause = function() {
            _this.isPlaying = false
            player.classList.remove('playing')
            cdThumbAnimate.pause(); // Cùng lúc pause thì cdThumb cũng dừng
        }

        // Khi tiến độ bài hát thay đổi
        // Khi "lắng nghe event" thì ta đọc tài liệu ở phần event
        // Khi "muốn lấy ra giá trị gì đó, hoặc set value gì đó" thì ta đọc ở phần properties
        // Khi "thực hiện hành động gì đó" thì đọc ở phần methods
        // Tính ra % thanh ngang audio.currentTime / audio.duration * 100
        audio.ontimeupdate = function () {
            // Xử lý progress nếu nó NaN
            if (audio.duration) {
                const progressPercent = Math.floor(audio.currentTime / audio.duration * 100)
                progress.value = progressPercent;
            }
        }

        // Xử lý khi tua song
        progress.onchange = function(e) {
            // lấy tổng số giây / 100% * %progress
            // Kỹ thuật clean code
            const seekTime = audio.duration / 100 * e.target.value;
            audio.currentTime = seekTime;
        }

        // Khi next song
        nextBtn.onclick = function() {
            if (_this.isRandom) {
                _this.playRandomSong()  
            } else {
                _this.nextSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong()
        }

        // Khi prev song
        prevBtn.onclick = function() {
            if (_this.isRandom) {
                _this.playRandomSong()  
            } else {
                _this.prevSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong()
        }

        // Xử lý bật / tắt random song
        randomBtn.onclick = function() {
            _this.isRandom = !_this.isRandom
            _this.setConfig('isRandom', _this.isRandom)
            // Nếu ('active', true) ngược lại ('', false)
            randomBtn.classList.toggle('active', _this.isRandom)
        }

        // Xử lý lặp lại 1 song
        repeatBtn.onclick = function() {
            _this.isRepeat = !_this.isRepeat
            _this.setConfig('isRepeat', _this.isRepeat)
            // Nếu ('active', true) ngược lại ('', false)
            repeatBtn.classList.toggle('active', _this.isRepeat)
        }

        // Xử lý next song khi audio ended
        audio.onended = function () {
            if (_this.isRepeat) {
                audio.play();
            } else {
                nextBtn.click();
            }
        }

        // Lắng nghe hành vi click vào playlist
        playlist.onclick = function (e) {
            const songNode = e.target.closest('.song:not(.active)')
            //e là event lấy được ở tham số function còn target là đích khi click vào nó trả về cái mà ta click
            // Tức là khi ta click vào bất cứ thành phần nào của playlist thì nó nhận được
            // closest trả về chính nó hoặc cha của nó, nếu không tìm thấy thì trả về null
            if (songNode || e.target.closest('.option')) {
                // Xử lý khi click vào song, chuyển đến bài đó
                if (songNode) {
                    // get index (dataset là getAttribute('data-index') dataset khi lấy sẽ là chuỗi nên ta phải convert sang Num)
                    _this.currentIndex = Number(songNode.dataset.index);
                    _this.loadCurrentSong();
                    _this.render();
                    audio.play();
                }

                // Xử lý khi click vào song option
                if (e.target.closest('.option')) {

                }
            }
        }
    },
    
    // Tải bài hát hiện tại
    loadCurrentSong: function() {
        heading.textContent = this.currentSong.name;
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.path;
    },
    loadConfig: function() {
        this.isRandom = this.config.isRandom
        this.isRandom = this.config.isRepeat
    },
    // Tải bài hát tiếp theo
    nextSong: function () {
        this.currentIndex++;
        if (this.currentIndex >= this.songs.length) {
            this.currentIndex = 0
        }
        this.loadCurrentSong();
    },
    prevSong: function () {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1
        }
        this.loadCurrentSong();
    },
    playRandomSong: function() {
        let newIndex;
        // sử dụng doWhile ít nhất chạy 1 lần, mục đích random không dích 2 lần bài hiện tại ra
        do {
            newIndex = Math.floor(Math.random() * this.songs.length)
        } while (newIndex === this.currentIndex) // Nếu không trùng lại index thì nó lặp tiếp đến khi không trùng thì thôi
        // Sau đó set lại giá trị và loadCurrentSong
        this.currentIndex = newIndex;
        this.loadCurrentSong();
    },
    scrollToActiveSong: function() {
        setTimeout(() => {
            $('.song.active').scrollIntoView(
                {
                    behavior: 'smooth',
                    block: 'nearest', // Giúp nó ko kéo mạnh
                }
            )
        }, 300)
    },
    start: function () {
        // Gán cấu hình từ config vào ứng dụng
        this.loadConfig();

        // Định nghĩa các thuộc tính cho Object
        this.defineProperties();

        // Lắng nghe / xử lý các sự kiện (DOM events)
        this.handleEvents();

        // Tải thông tin bài hát đầu tiên vào UI khi chạy ứng dụng
        this.loadCurrentSong();

        // Render playlist
        this.render();

        // Hiển thị trạng thái ban đầu của button repeat và random
        // randomBtn.classList.toggle('active', this.isRandom)
        repeatBtn.classList.toggle('active', this.isRepeat)
    }
}

// Gọi start để load, khi ứng dụng chạy code sẽ rơi vào function start
// Mục đích chỉ gọi 1 lần ko cần gọi nhiều
app.start();