// 遊戲配置
const config = {
    initialZoom: 1,
    minZoom: 0.1,
    maxZoom: 5,
    targetRadius: 2,
    trailOpacity: 0.5,
    zoomSpeed: 0.1
};

// 遊戲狀態
const gameState = {
    isInitialized: false,
    isLoading: true,
    error: null
};

const objects = [
    { x: 150, y: 100, width: 50, height: 50, text: "物件1" },
    { x: 300, y: 200, width: 50, height: 50, text: "物件2" },
    { x: 450, y: 300, width: 50, height: 50, text: "物件3" }
  ];

  function drawObjects(ctx, zoomFactor, offsetX, offsetY) {
    objects.forEach(obj => {
      // 計算縮放後的坐標與大小
      const scaledX = obj.x * zoomFactor + offsetX;
      const scaledY = obj.y * zoomFactor + offsetY;
      const scaledWidth = obj.width * zoomFactor;
      const scaledHeight = obj.height * zoomFactor;
  
      // 繪製物件
      ctx.fillStyle = "blue";
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
  
      // 繪製文字
      ctx.fillStyle = "white";
      ctx.font = `${12 * zoomFactor}px Arial`;
      ctx.fillText(obj.text, scaledX + 5, scaledY + 15);
    });
  }

class MazeGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.initializeCanvas();
        
        // 遊戲狀態
        this.zoomFactor = config.initialZoom;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        // 原有的建構函式內容
        // 加入新的變數追蹤上一個有效的滑鼠位置
        this.lastValidMouseX = null;
        this.lastValidMouseY = null;
        
        // 目標物件
        this.target = {
            x: 70,
            y: 1130,
            radius: config.targetRadius,
            color: 'red',
            borderColor: 'blue',
            following: false,
            trail: []
        };

        // 添加地點物件
        this.locations = [
            { 
                x: 725, 
                y: 760, 
                width: 70, 
                height: 30, 
                text: "太和殿", 
                description: "太和殿俗稱金鑾殿，為北京故宮外朝三大殿中最南面的殿。該殿是明清兩朝北京城內最高的建築，開間最多、進深最大和屋頂最高的大殿，堪稱中華第一殿。皇帝登基、冊立皇后等大典都在此舉行。太和殿是皇權的象徵，因而在各種形式上都刻意追求，以示與眾不同。太和殿並非皇帝日常上朝的地方，太和殿是只有在舉行大朝會或是皇帝御駕親征以及舉行重大儀式的地方，（皇帝平時處理公務的地方位在太和殿後方的乾清宮）。",
                color: "rgba(255, 165, 0, 1)"
            },
            { 
                x: 740, 
                y: 30, 
                width: 50, 
                height: 20, 
                text: "神武門", 
                description: "紫禁城的四座大門分別為：正門是午門，東門叫東華門，西門叫西華門，北門名玄武門。按照風水中的四象學中的左青龍，右白虎，前朱雀，後玄武，玄武主北方，所以帝王宮殿的北宮門多取名「玄武」。清康熙年間因避諱其名字玄燁改稱「神武門」，其在形制上比午門低一個等級。它是宮內日常出入的門禁。",
                color: "rgba(255, 165, 0, 1)"
            },
            { 
                x: 725, 
                y: 1160, 
                width: 70, 
                height: 30, 
                text: "午門", 
                description: "明代午門與天安門之間的廊廡全部是黃瓦，皇城禦道全部是漢白玉的；在清代午門與天安門之間的廊廡被改成灰瓦，皇城禦道更換成青石板。這是一大變化。明代的午門，兩邊的燕翅樓是籙頂的，而不是現代的攥尖頂。而且午門外的朝房也是黃瓦，中間禦道是漢白玉的，不是現在的青石板。且在明朝紫禁城正門午門前有6座石製大象雕塑，但是到了清朝時期，這六尊大象雕塑已經被損毀，看不到了。皇城的正門是皇宮的「皋門」，是宣召的地方，就像大明宮宣召在丹鳳門，北京皇宮宣召在承天門。",
                color: "rgba(255, 165, 0, 1)"
            },{ 
                x: 300, 
                y: 960, 
                width: 30, 
                height: 15, 
                text: "武英殿", 
                description: "武英殿是一組建於明代永樂年間的宮殿建築，位於北京故宮外朝熙和門以西，正殿武英殿南向，面闊5間，進深3間，黃琉璃瓦歇山頂。須彌座圍以漢白玉石欄，前出月台，有甬路直通武英門。在明朝初期帝王齋居、召見大臣這些隆重的活動都是集中在武英殿的，崇禎年間皇后千秋、命婦朝賀儀也在此舉行，足見其在明朝的地位。",
                color: "rgba(255, 165, 0, 1)"
            },{ 
                x: 900, 
                y: 900, 
                width: 30, 
                height: 15, 
                text: "文華殿", 
                description: "文華殿起初是皇帝常禦之便殿，明朝天順朝、成化朝，太子踐祚以前，首先攝事於文華殿。後來由於眾太子多少，無法參與政事，嘉靖十五年（1536年）將文華殿仍改為皇帝便殿，後來作為每年春秋仲月的經筵之所，文華殿建築隨之由綠琉璃瓦頂改為黃琉璃瓦頂。",
                color: "rgba(255, 165, 0, 1)"
            },{ 
                x: 1050, 
                y: 700, 
                width: 30, 
                height: 15, 
                text: "南三所", 
                description: "明朝這一帶有端敬殿、端本宮，為東宮太子所居。清乾隆十一年（1746年）在原有遺址上興建三所院落，因其位於寧壽宮以南，故又稱「南三所」，也稱「阿哥所」或「所兒」，嘉慶朝以後多以「麋芳殿」代稱整組建築。南三所共用一座宮門，門內有一東西窄長的小廣場，廣場北側自東向西依序排列3所，每所皆為前後3進，形製完全相同。整個南三間共有房200餘間。南三所位在紫禁城東部，按陰陽五行之說，東方屬木，青色，主生長，故屋頂多覆綠琉璃瓦，並安排皇子在此居住。",
                color: "rgba(255, 165, 0, 1)"
            },{ 
                x: 725, 
                y: 550, 
                width: 30, 
                height: 15, 
                text: "乾清宮", 
                description: "乾清宮建築規模為內廷之首，採用黃琉璃瓦重檐五殿頂，座落於單層漢白玉玉石臺基上。乾清宮面闊9間，進深5間，高20米，建築結構為減柱造行形式，以擴大室內空間，設有寶座。明朝的十四個皇帝和清代的順治、康熙兩個皇帝，都以乾清宮為寢宮（自雍正始移居養心殿）。",
                color: "rgba(255, 165, 0, 1)"
            },{ 
                x: 500, 
                y: 600, 
                width: 30, 
                height: 15, 
                text: "養心殿", 
                description: "養心殿位於紫禁城內廷西南方，從雍正開始，近二百年來歷代清帝均以此為休息及辦公的地方，因此，養心殿可說是紫禁城的心臟，是支配著大清王朝興衰、詔書發布的重要場所。雍正即位以後，養心殿成為皇帝日常辦公就寢之地，在此批章閱本，召對引見，宣諭籌策漸成為慣例，因而此後清的各代皇帝均以此地做為主要辦公的地方，如晚清時的慈禧太后即在養心殿垂簾聽政，而末代皇帝溥儀宣布退位的詔書，亦是從養心殿發出來的。",
                color: "rgba(255, 165, 0, 1)"
            },{ 
                x: 1050, 
                y: 650, 
                width: 30, 
                height: 15, 
                text: "寧壽宮", 
                description: "寧壽宮，又稱為乾隆花園，位處紫禁城東北角、寧壽宮區左側長方形的小片區，為一七七一年乾隆親自下旨改建成太上皇宮。但終其一生，乾隆並未有機會在此久住，而這處園林隨後便在他諭令下保持一切規制、不得改建，之後歷任清帝都遵循祖訓，僅將寧壽宮做為宴會祭典場所使用。",
                color: "rgba(255, 165, 0, 1)"
            },{ 
                x: 725, 
                y: 330, 
                width: 70, 
                height: 30, 
                text: "御花園", 
                description: "御花園，位於紫禁城中軸線上，是一座微型的皇宮後廷花園。這裡設有花石小徑、假山、池塘、古林。御花園設在皇宮中路的末端，很有意味。領略了皇宮中路一座座高大巍峨的宮殿莊嚴肅穆的感覺之後，來到御花園，會體會皇宮溫和婉約的一面。御花園原來是皇帝及后妃憩賞的園林，也兼具頤養、祭祀、讀書、藏書等功能。御花園的主體建築欽安殿是重簷盝頂式建築，處在紫禁城中軸線上，以欽安殿為中心，向南側東、西兩側佈置亭台樓閣。禦花園內的竹、柏、松之間點綴山石，形成了四季長青的景觀。",
                color: "rgba(255, 165, 0, 1)"
            }
        ];

        // 添加描述面板的引用
        this.descriptionPanel = document.getElementById('descriptionPanel');
        if (!this.descriptionPanel) {
            this.createDescriptionPanel();
        }
        
        this.bindEvents();
        this.loadMazeImage();
    }

    initializeCanvas() {
        // 設定固定的畫布大小
        const CANVAS_WIDTH = 1500;  // 或其他你想要的固定寬度
        const CANVAS_HEIGHT = 1321; // 或其他你想要的固定高度
        
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        // 使用 CSS 來控制顯示大小，保持長寬比
        this.canvas.style.width = '100%';
        this.canvas.style.height = 'auto';
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.objectFit = 'contain';
        
        // 防止畫布被壓縮
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = 'crisp-edges';
    }
    
    loadMazeImage() {
        this.mazeImage = new Image();
        this.mazeImage.onload = () => {
            // 初始化遊戲狀態
            gameState.isLoading = false;
            gameState.isInitialized = true;
    
            // 繪製迷宮圖像
            this.ctx.drawImage(this.mazeImage, 0, 0, this.canvas.width, this.canvas.height);
    
            // 生成碰撞地圖 (假設已有 generateCollisionMap 方法)
            this.generateCollisionMap();
    
            // 可視化碰撞地圖
            //this.visualizeCollisionMap();
    
            // 開始遊戲循環
            this.startGameLoop();
        };
        this.mazeImage.onerror = (error) => {
            gameState.error = '迷宮圖片載入失敗';
            console.error('圖片載入錯誤:', error);
        };
        this.mazeImage.src = './images/紫禁城平面圖.png';
    }

    generateCollisionMap() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
    
        // 建立空的二維陣列
        const collisionMap = Array.from({ length: canvasHeight }, () => 
            Array(canvasWidth).fill(0)
        );
    
        // 讀取整個畫布的像素資料
        const imageData = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        const data = imageData.data;
    
        for (let y = 0; y < canvasHeight; y++) {
            for (let x = 0; x < canvasWidth; x++) {
                const index = (y * canvasWidth + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];
    
                // 如果是黑色像素（或近似黑色）
                if (r <= 20 && g <= 20 && b <= 20 && a > 0) {
                    collisionMap[y][x] = 1; // 直接標記為障礙物
                }
            }
        }
    
        this.collisionMap = collisionMap;
        console.log("碰撞地圖生成完成！");
    }

    // 創建描述面板
    createDescriptionPanel() {
        this.descriptionPanel = document.createElement('div');
        this.descriptionPanel.id = 'descriptionPanel';
        this.descriptionPanel.style.cssText = `
            position: fixed;
            right: 20px;
            top: 20px;
            width: 300px;
            padding: 20px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(this.descriptionPanel);
    }

    bindEvents() {
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasScaleX = this.canvas.width / rect.width;
        const canvasScaleY = this.canvas.height / rect.height;

        // 將初始的 lastValidMouse 座標轉換為畫布內部座標
        this.lastValidMouseX = (event.clientX - rect.left) * canvasScaleX;
        this.lastValidMouseY = (event.clientY - rect.top) * canvasScaleY;
        
        // 計算當前滑鼠在畫布上的位置
        const currentMouseX = (event.clientX - rect.left) * canvasScaleX;
        const currentMouseY = (event.clientY - rect.top) * canvasScaleY;

        console.log(`目標座標: x=${this.target.x}, y=${this.target.y}`);

        // 初始化或更新上一個有效的滑鼠位置
        if (this.lastValidMouseX === null) {
            this.lastValidMouseX = currentMouseX;
            this.lastValidMouseY = currentMouseY;
        }

        if (this.isDragging) {
            if (!this.target.following) {
                const dx = ((event.clientX - this.lastMouseX) * canvasScaleX);
                const dy = ((event.clientY - this.lastMouseY) * canvasScaleY);
    
                this.offsetX += dx;
                this.offsetY += dy;
    
                this.target.x += dx;
                this.target.y += dy;
                this.target.trail = this.target.trail.map(point => ({
                    x: point.x + dx,
                    y: point.y + dy
                }));
            }
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        } 
        
        if (this.target.following) {
            console.log("檢測碰撞:", {
                lastX: this.lastValidMouseX,
                lastY: this.lastValidMouseY,
                currentX: currentMouseX,
                currentY: currentMouseY
            });

            // 檢查碰撞
            if (this.isLineCollidingWithObstacle(
                this.lastValidMouseX,
                this.lastValidMouseY,
                currentMouseX,
                currentMouseY
            )) {
                console.log("檢測到碰撞!");
            
                if (this.target.trail.length >= 5) {
                    const trailPoints = [];
                    for (let i = 0; i < 5; i++) {
                        trailPoints.push(this.target.trail.pop()); // 移除並保存最後五個點
                    }
                
                    const lastTrailPoint = trailPoints[trailPoints.length - 1];
                    this.target.x = lastTrailPoint.x;
                    this.target.y = lastTrailPoint.y;
                
                    console.log("退回到最近的五個點:", trailPoints);
                }
            
                // 停止跟隨並更改目標顏色
                this.target.following = false;
                this.target.color = 'red';
                return;
            }

            // 更新目標位置
            this.target.x = currentMouseX;
            this.target.y = currentMouseY;
            
            // 添加新的軌跡點
            this.target.trail.push({
                x: this.target.x,
                y: this.target.y
            });

            // 限制軌跡長度
            if (this.target.trail.length > 1000) {
                this.target.trail.shift();
            }

            // 更新上一個有效的滑鼠位置
            this.lastValidMouseX = currentMouseX;
            this.lastValidMouseY = currentMouseY;
        }
    }

    handleMouseDown(event) {
        const { clientX: mouseX, clientY: mouseY } = event;

        if (event.button === 0) { // 左鍵
            this.isDragging = true;
            this.lastMouseX = mouseX;
            this.lastMouseY = mouseY;
        }
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    // 更新處理點擊事件
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasScaleX = this.canvas.width / rect.width;
        const canvasScaleY = this.canvas.height / rect.height;
        
        // 轉換滑鼠座標到畫布座標系統
        const adjustedMouseX = (event.clientX - rect.left) * canvasScaleX;
        const adjustedMouseY = (event.clientY - rect.top) * canvasScaleY;

        // 檢查是否點擊了目標
        if (this.isMouseOnTarget(event.clientX, event.clientY)) {
            this.target.following = !this.target.following;
            if (this.target.following) {
                this.target.trail = [{ x: this.target.x, y: this.target.y }];
                this.target.color = 'blue';
            } else {
                this.target.color = 'red';
            }
            return;
        }

        // 檢查是否點擊了地點物件
        const clickedLocation = this.locations.find(loc => {
            const scaledX = loc.x * this.zoomFactor + this.offsetX;
            const scaledY = loc.y * this.zoomFactor + this.offsetY;
            const scaledWidth = loc.width * this.zoomFactor;
            const scaledHeight = loc.height * this.zoomFactor;

            return (
                adjustedMouseX >= scaledX &&
                adjustedMouseX <= scaledX + scaledWidth &&
                adjustedMouseY >= scaledY &&
                adjustedMouseY <= scaledY + scaledHeight
            );
        });

        if (clickedLocation) {
            this.showDescription(clickedLocation.text, clickedLocation.description);
        }
    }

    // 顯示描述文字
    showDescription(title, description) {
        this.descriptionPanel.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">${title}</h3>
            <p style="margin: 0;">${description}</p>
        `;
    }

    // 更新縮放處理
    handleWheel(event) {
        event.preventDefault();
        
        if (this.target.following) return;

        const { clientX: mouseX, clientY: mouseY, deltaY } = event;
        const zoomDirection = deltaY < 0 ? 1 : -1;
        const zoomFactor = 1 + zoomDirection * config.zoomSpeed;
        const newZoom = this.zoomFactor * zoomFactor;

        if (newZoom >= config.minZoom && newZoom <= config.maxZoom) {
            const rect = this.canvas.getBoundingClientRect();
            const mousePos = {
                x: mouseX - this.offsetX,
                y: mouseY - this.offsetY
            };

            this.zoomFactor = newZoom;
            this.offsetX = mouseX - mousePos.x * zoomFactor;
            this.offsetY = mouseY - mousePos.y * zoomFactor;

            // 更新目標位置
            const targetRelativeX = (this.target.x - mouseX) * zoomFactor;
            const targetRelativeY = (this.target.y - mouseY) * zoomFactor;
            this.target.x = mouseX + targetRelativeX;
            this.target.y = mouseY + targetRelativeY;

            // 更新軌跡點
            this.target.trail = this.target.trail.map(point => ({
                x: mouseX + (point.x - mouseX) * zoomFactor,
                y: mouseY + (point.y - mouseY) * zoomFactor
            }));
        }
    }

    isMouseOnTarget(mouseX, mouseY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasScaleX = this.canvas.width / rect.width;
        const canvasScaleY = this.canvas.height / rect.height;
        
        // 轉換滑鼠座標到畫布座標系統
        const adjustedMouseX = (mouseX - rect.left) * canvasScaleX;
        const adjustedMouseY = (mouseY - rect.top) * canvasScaleY;
        
        // 計算距離，考慮縮放和偏移
        const dist = Math.sqrt(
            (adjustedMouseX - this.target.x) ** 2 + 
            (adjustedMouseY - this.target.y) ** 2
        );
        
        return dist < (this.target.radius * this.zoomFactor * 2);
    }

    isLineCollidingWithObstacle(x1, y1, x2, y2) {
        if (!this.collisionMap) {
            console.error("碰撞地圖未生成！");
            return false;
        }
    
        // 將螢幕座標轉換為原始圖像座標
        const adjustedX1 = Math.round((x1 - this.offsetX) / this.zoomFactor);
        const adjustedY1 = Math.round((y1 - this.offsetY) / this.zoomFactor);
        const adjustedX2 = Math.round((x2 - this.offsetX) / this.zoomFactor);
        const adjustedY2 = Math.round((y2 - this.offsetY) / this.zoomFactor);
    
        const distance = Math.sqrt((adjustedX2 - adjustedX1) ** 2 + (adjustedY2 - adjustedY1) ** 2);
        const steps = Math.max(Math.ceil(distance), 10);
    
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.round(adjustedX1 + (adjustedX2 - adjustedX1) * t);
            const y = Math.round(adjustedY1 + (adjustedY2 - adjustedY1) * t);
    
            // 確保不超出地圖邊界
            if (
                x >= 0 && x < this.collisionMap[0].length &&
                y >= 0 && y < this.collisionMap.length
            ) {
                if (this.collisionMap[y][x] === 1) {
                    console.log("碰撞發生於點:", { x, y });
                    return true;
                }
            }
        }
    
        return false;
    }
    // 更新繪製函數
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
        // 繪製迷宮背景
        if (gameState.isInitialized) {
            this.ctx.save();
            this.ctx.translate(this.offsetX, this.offsetY);
            this.ctx.scale(this.zoomFactor, this.zoomFactor);
            
            this.ctx.drawImage(
                this.mazeImage,
                0,
                0,
                this.canvas.width,
                this.canvas.height
            );
            
            this.ctx.restore();
        }
    
        // 繪製地點物件
        this.drawLocations();
    
        // 繪製目標和軌跡
        this.drawTarget();
    
        // 繪製載入中或錯誤訊息
        if (gameState.isLoading) {
            this.drawMessage('載入中...');
        } else if (gameState.error) {
            this.drawMessage(gameState.error, 'red');
        }
    }

    // 繪製地點物件
    drawLocations() {
        this.locations.forEach(loc => {
            const scaledX = loc.x * this.zoomFactor + this.offsetX;
            const scaledY = loc.y * this.zoomFactor + this.offsetY;
            const scaledWidth = loc.width * this.zoomFactor;
            const scaledHeight = loc.height * this.zoomFactor;

            // 繪製半透明背景
            this.ctx.fillStyle = loc.color;
            this.ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

            // 繪製文字
            this.ctx.fillStyle = 'black';
            const fontSize = 24 * this.zoomFactor; // 增加基礎字體大小
            this.ctx.font = `bold ${fontSize}px Arial`; // 添加粗體
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle'; // 確保垂直置中
            this.ctx.fillText(
                loc.text,
                scaledX + scaledWidth / 2,
                scaledY + scaledHeight / 2
            );
        });
    }
    
    visualizeCollisionMap() {
        if (!this.collisionMap) {
            console.error("碰撞地圖未生成！");
            return;
        }
    
        this.ctx.save();
    
        // 考慮偏移與縮放
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.zoomFactor, this.zoomFactor);
    
        // 遍歷碰撞地圖
        for (let y = 0; y < this.collisionMap.length; y++) {
            for (let x = 0; x < this.collisionMap[0].length; x++) {
                if (this.collisionMap[y][x] === 1) {
                    // 使用半透明紅色繪製障礙物
                    this.ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
                    this.ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    
        this.ctx.restore();
    }

    drawTarget() {
        const scaledRadius = this.target.radius * this.zoomFactor;

        // 繪製軌跡
        if (this.target.trail.length > 1) {
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${config.trailOpacity})`;
            this.ctx.beginPath();
            this.ctx.moveTo(this.target.trail[0].x, this.target.trail[0].y);
            this.target.trail.forEach(point => {
                this.ctx.lineTo(point.x, point.y);
            });
            this.ctx.stroke();
        }

        // 繪製目標外框
        this.ctx.strokeStyle = this.target.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.target.x, this.target.y, scaledRadius + 2, 0, Math.PI * 2);
        this.ctx.stroke();

        // 繪製目標填充
        this.ctx.fillStyle = this.target.color;
        this.ctx.beginPath();
        this.ctx.arc(this.target.x, this.target.y, scaledRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawMessage(message, color = 'black') {
        this.ctx.fillStyle = color;
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            message,
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }

    startGameLoop() {
        const gameLoop = () => {
            this.draw();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
}

// 初始化遊戲
const game = new MazeGame('gameCanvas');