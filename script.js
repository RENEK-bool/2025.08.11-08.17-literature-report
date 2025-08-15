// 图片点击放大功能 - 增强版
        document.addEventListener('DOMContentLoaded', function() {
            /* ====== 目录交互：平滑滚动 + 高亮当前 ====== */
            const tocLinks = Array.from(document.querySelectorAll('.toc-item a'));
            const sections = tocLinks
                .map(a => document.getElementById(a.getAttribute('data-target')))
                .filter(Boolean);

            function setActive(link) {
                tocLinks.forEach(l => l.classList.remove('active'));
                if (link) link.classList.add('active');
            }

            // 点击平滑滚动
            tocLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const id = this.getAttribute('data-target');
                    const el = document.getElementById(id);
                    if (!el) return;
                    // 平滑滚动，考虑顶部留白
                    const rect = el.getBoundingClientRect();
                    const absoluteY = window.scrollY + rect.top - 12; // 轻微上边距
                    window.history.replaceState(null, '', `#${id}`);
                    window.scrollTo({ top: absoluteY, behavior: 'smooth' });
                    setActive(this);
                });
            });

            // 滚动高亮当前 section
            if (sections.length) {
                const observer = new IntersectionObserver((entries) => {
                    // 选择视窗中部附近最可见的 section
                    let best = null;
                    for (const entry of entries) {
                        if (entry.isIntersecting) {
                            if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
                        }
                    }
                    if (best) {
                        const id = best.target.id;
                        const activeLink = tocLinks.find(a => a.getAttribute('data-target') === id);
                        setActive(activeLink);
                    }
                }, { root: null, rootMargin: '-30% 0px -55% 0px', threshold: [0.1, 0.25, 0.5, 0.75] });
                sections.forEach(sec => observer.observe(sec));
            }

            // 移动端侧边栏开关
            const sidebar = document.querySelector('.sidebar');
            const toggleBtn = document.querySelector('.sidebar-toggle');
            if (toggleBtn && sidebar) {
                toggleBtn.addEventListener('click', () => {
                    sidebar.classList.toggle('open');
                });
                // 点击目录项后关闭抽屉
                tocLinks.forEach(link => link.addEventListener('click', () => sidebar.classList.remove('open')));
            }

            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            const closeBtn = document.getElementsByClassName('close')[0];
            const zoomInBtn = document.getElementById('zoomIn');
            const zoomOutBtn = document.getElementById('zoomOut');
            const resetZoomBtn = document.getElementById('resetZoom');
            const zoomLevel = document.getElementById('zoomLevel');
            const prevBtn = document.getElementById('prevImage');
            const nextBtn = document.getElementById('nextImage');
            
            let currentZoom = 1;
            let isDragging = false;
            let dragStartX, dragStartY;
            let imageStartX, imageStartY;
            let allImages = [];
            let currentImageIndex = 0;
            
            // 触摸支持变量
            let touchStartTime = 0;
            let lastTouchEnd = 0;
            let touchCount = 0;
            let initialDistance = 0;
            let initialZoom = 1;
            
            // 获取所有图片
            function initImageList() {
                allImages = Array.from(document.querySelectorAll('.figure-img'));
            }
            
            // 更新导航按钮状态
            function updateNavButtons() {
                prevBtn.classList.toggle('disabled', currentImageIndex === 0);
                nextBtn.classList.toggle('disabled', currentImageIndex === allImages.length - 1);
            }
            
            // 更新缩放显示
            function updateZoomDisplay() {
                zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
                // 设置鼠标样式
                modalImg.style.cursor = isDragging ? 'grabbing' : 'grab';
            }
            
            // 显示指定索引的图片
            function showImageAtIndex(index) {
                if (index >= 0 && index < allImages.length) {
                    currentImageIndex = index;
                    modalImg.src = allImages[index].src;
                    resetZoom();
                    updateNavButtons();
                }
            }
            
            // 重置缩放和位置
            function resetZoom() {
                currentZoom = 1;
                modalImg.style.transform = 'translate(-50%, -50%) scale(1)';
                modalImg.style.left = '50%';
                modalImg.style.top = '50%';
                updateZoomDisplay();
            }
            
            // 缩放函数
            function zoomImage(factor) {
                const oldZoom = currentZoom;
                currentZoom *= factor;
                currentZoom = Math.max(0.1, Math.min(currentZoom, 5));
                
                if (currentZoom !== oldZoom) {
                    // 获取当前位置
                    const rect = modalImg.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    // 计算新的位置偏移
                    const viewportCenterX = window.innerWidth / 2;
                    const viewportCenterY = window.innerHeight / 2;
                    
                    const offsetX = centerX - viewportCenterX;
                    const offsetY = centerY - viewportCenterY;
                    
                    // 应用新的变换
                    modalImg.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${currentZoom})`;
                    modalImg.style.left = '50%';
                    modalImg.style.top = '50%';
                    
                    updateZoomDisplay();
                }
            }
            
            // 初始化图片列表
            initImageList();
            
            // 为所有图片添加点击事件
            allImages.forEach(function(img, index) {
                img.addEventListener('click', function() {
                    modal.style.display = 'block';
                    currentImageIndex = index;
                    modalImg.src = this.src;
                    resetZoom();
                    updateNavButtons();
                });
            });
            
            // 导航按钮事件
            prevBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (currentImageIndex > 0) {
                    showImageAtIndex(currentImageIndex - 1);
                }
            });
            
            nextBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (currentImageIndex < allImages.length - 1) {
                    showImageAtIndex(currentImageIndex + 1);
                }
            });
            
            // 缩放控制按钮
            zoomInBtn.addEventListener('click', () => zoomImage(1.2));
            zoomOutBtn.addEventListener('click', () => zoomImage(0.8));
            resetZoomBtn.addEventListener('click', resetZoom);
            
            // 鼠标滚轮缩放
            modalImg.addEventListener('wheel', function(e) {
                e.preventDefault();
                const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                zoomImage(zoomFactor);
            });
            
            // 改进的拖拽功能 - 任何缩放级别都可以拖拽
            modalImg.addEventListener('mousedown', function(e) {
                e.preventDefault();
                isDragging = true;
                
                // 记录拖拽开始时的鼠标位置
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                
                // 记录拖拽开始时图片的位置
                const rect = modalImg.getBoundingClientRect();
                imageStartX = rect.left + rect.width / 2;
                imageStartY = rect.top + rect.height / 2;
                
                modalImg.classList.add('dragging');
                updateZoomDisplay();
            });
            
            document.addEventListener('mousemove', function(e) {
                if (isDragging) {
                    // 计算鼠标移动的距离
                    const deltaX = e.clientX - dragStartX;
                    const deltaY = e.clientY - dragStartY;
                    
                    // 计算图片新的中心位置
                    const newCenterX = imageStartX + deltaX;
                    const newCenterY = imageStartY + deltaY;
                    
                    // 计算相对于视口中心的偏移
                    const viewportCenterX = window.innerWidth / 2;
                    const viewportCenterY = window.innerHeight / 2;
                    
                    const offsetX = newCenterX - viewportCenterX;
                    const offsetY = newCenterY - viewportCenterY;
                    
                    // 更新图片位置
                    modalImg.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${currentZoom})`;
                    modalImg.style.left = '50%';
                    modalImg.style.top = '50%';
                }
            });
            
            document.addEventListener('mouseup', function() {
                if (isDragging) {
                    isDragging = false;
                    modalImg.classList.remove('dragging');
                    updateZoomDisplay();
                }
            });
            
            // 关闭模态框
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
                resetZoom();
            });
            
            // 点击模态框外部关闭
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                    resetZoom();
                }
            });
            
            // ESC键关闭
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    modal.style.display = 'none';
                    resetZoom();
                }
                // 快捷键支持
                if (modal.style.display === 'block') {
                    if (event.key === '+' || event.key === '=') {
                        event.preventDefault();
                        zoomImage(1.2);
                    } else if (event.key === '-') {
                        event.preventDefault();
                        zoomImage(0.8);
                    } else if (event.key === '0') {
                        event.preventDefault();
                        resetZoom();
                    } else if (event.key === 'ArrowLeft') {
                        event.preventDefault();
                        if (currentImageIndex > 0) {
                            showImageAtIndex(currentImageIndex - 1);
                        }
                    } else if (event.key === 'ArrowRight') {
                        event.preventDefault();
                        if (currentImageIndex < allImages.length - 1) {
                            showImageAtIndex(currentImageIndex + 1);
                        }
                    }
                }
            });
            
            // 防止图片拖拽的默认行为
            modalImg.addEventListener('dragstart', function(e) {
                e.preventDefault();
            });
            
            // 触摸事件支持
            function getTouchDistance(touches) {
                if (touches.length < 2) return 0;
                const touch1 = touches[0];
                const touch2 = touches[1];
                return Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) + 
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
            }
            
            // 触摸开始
            modalImg.addEventListener('touchstart', function(e) {
                touchStartTime = Date.now();
                touchCount = e.touches.length;
                
                if (touchCount === 1) {
                    // 单指触摸 - 准备拖拽
                    const touch = e.touches[0];
                    isDragging = true;
                    
                    dragStartX = touch.clientX;
                    dragStartY = touch.clientY;
                    
                    const rect = modalImg.getBoundingClientRect();
                    imageStartX = rect.left + rect.width / 2;
                    imageStartY = rect.top + rect.height / 2;
                    
                    modalImg.classList.add('dragging');
                } else if (touchCount === 2) {
                    // 双指触摸 - 准备缩放
                    isDragging = false;
                    initialDistance = getTouchDistance(e.touches);
                    initialZoom = currentZoom;
                }
                
                updateZoomDisplay();
            });
            
            // 触摸移动
            modalImg.addEventListener('touchmove', function(e) {
                e.preventDefault();
                
                if (touchCount === 1 && isDragging) {
                    // 单指拖拽
                    const touch = e.touches[0];
                    const deltaX = touch.clientX - dragStartX;
                    const deltaY = touch.clientY - dragStartY;
                    
                    const newCenterX = imageStartX + deltaX;
                    const newCenterY = imageStartY + deltaY;
                    
                    const viewportCenterX = window.innerWidth / 2;
                    const viewportCenterY = window.innerHeight / 2;
                    
                    const offsetX = newCenterX - viewportCenterX;
                    const offsetY = newCenterY - viewportCenterY;
                    
                    modalImg.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${currentZoom})`;
                    modalImg.style.left = '50%';
                    modalImg.style.top = '50%';
                } else if (touchCount === 2 && e.touches.length === 2) {
                    // 双指缩放
                    const newDistance = getTouchDistance(e.touches);
                    if (initialDistance > 0) {
                        const zoomFactor = newDistance / initialDistance;
                        const newZoom = initialZoom * zoomFactor;
                        currentZoom = Math.max(0.1, Math.min(newZoom, 5));
                        
                        modalImg.style.transform = `translate(-50%, -50%) scale(${currentZoom})`;
                        modalImg.style.left = '50%';
                        modalImg.style.top = '50%';
                        
                        updateZoomDisplay();
                    }
                }
            });
            
            // 触摸结束
            modalImg.addEventListener('touchend', function(e) {
                const touchEndTime = Date.now();
                const touchDuration = touchEndTime - touchStartTime;
                
                // 检测双击
                if (touchCount === 1 && touchDuration < 300) {
                    const timeSinceLastTouch = touchEndTime - lastTouchEnd;
                    if (timeSinceLastTouch < 400 && timeSinceLastTouch > 0) {
                        // 双击缩放
                        if (currentZoom === 1) {
                            zoomImage(2); // 放大到200%
                        } else {
                            resetZoom(); // 重置到100%
                        }
                    }
                    lastTouchEnd = touchEndTime;
                }
                
                if (isDragging) {
                    isDragging = false;
                    modalImg.classList.remove('dragging');
                    updateZoomDisplay();
                }
                
                touchCount = 0;
            });
            
            // 手势取消
            modalImg.addEventListener('touchcancel', function(e) {
                if (isDragging) {
                    isDragging = false;
                    modalImg.classList.remove('dragging');
                    updateZoomDisplay();
                }
                touchCount = 0;
            });
        });


// ===== Enhanced Sidebar + Theme =====
(function(){
    document.addEventListener('DOMContentLoaded', function(){
        // Apply saved theme or prefer scheme
        try {
            const saved = localStorage.getItem('report-theme');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = saved || (prefersDark ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', theme);
        } catch {}

        const tocLinks = Array.from(document.querySelectorAll('.toc-item a'));
        const sections = tocLinks.map(a => document.getElementById(a.getAttribute('data-target'))).filter(Boolean);
        function setActive(link){ tocLinks.forEach(l=>l.classList.remove('active')); if(link) link.classList.add('active'); }

        // Click to scroll
        tocLinks.forEach(link=>{
            link.addEventListener('click', function(e){
                e.preventDefault();
                const id = this.getAttribute('data-target');
                const el = document.getElementById(id);
                if(!el) return;
                const rect = el.getBoundingClientRect();
                const absoluteY = (window.scrollY || window.pageYOffset) + rect.top - 12;
                window.history.replaceState(null, '', '#' + id);
                window.scrollTo({ top: absoluteY, behavior: 'smooth' });
                setActive(this);
            });
        });

        // IntersectionObserver (kept), plus scroll-based rAF highlight for robustness
        if(sections.length){
            const observer = new IntersectionObserver((entries)=>{
                let best=null;
                for(const entry of entries){
                    if(entry.isIntersecting){
                        if(!best || entry.intersectionRatio>best.intersectionRatio) best=entry;
                    }
                }
                if(best){
                    const id = best.target.id;
                    const activeLink = tocLinks.find(a=>a.getAttribute('data-target')===id);
                    setActive(activeLink);
                }
            }, { root:null, rootMargin:'-30% 0px -55% 0px', threshold:[0.1,0.25,0.5,0.75] });
            sections.forEach(sec=>observer.observe(sec));
        }

        // rAF-throttled scroll handler: pick the section nearest viewport center
        let ticking = false;
        function updateActiveByScroll(){
            if(!sections.length) return;
            const scrollY = window.scrollY || window.pageYOffset || 0;
            const viewportCenter = scrollY + window.innerHeight * 0.38; // slightly above center feels better
            let bestSec = null;
            let bestDist = Infinity;
            for(const sec of sections){
                const rect = sec.getBoundingClientRect();
                const secCenter = scrollY + rect.top + (rect.height || 0) / 2;
                const visible = rect.bottom > 80 && rect.top < window.innerHeight * 0.85;
                if(!visible) continue;
                const dist = Math.abs(secCenter - viewportCenter);
                if(dist < bestDist){ bestDist = dist; bestSec = sec; }
            }
            if(bestSec){
                const id = bestSec.id;
                const activeLink = tocLinks.find(a=>a.getAttribute('data-target')===id);
                setActive(activeLink);
            }
        }
        function onScroll(){
            if(!ticking){
                ticking = true;
                requestAnimationFrame(()=>{ updateActiveByScroll(); ticking = false; });
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        // Initial sync
        updateActiveByScroll();

        // Sidebar toggle
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.querySelector('.sidebar-toggle');
        if(toggleBtn && sidebar){ toggleBtn.addEventListener('click', ()=> sidebar.classList.toggle('open')); tocLinks.forEach(l=> l.addEventListener('click', ()=> sidebar.classList.remove('open'))); }

        // Add theme toggle button
        const themeBtn = document.createElement('button');
        themeBtn.setAttribute('aria-label','切换主题');
        themeBtn.style.position='fixed'; themeBtn.style.right='16px'; themeBtn.style.bottom='16px'; themeBtn.style.zIndex='1000';
        themeBtn.style.width='44px'; themeBtn.style.height='44px'; themeBtn.style.borderRadius='50%'; themeBtn.style.border='1px solid var(--border)';
        themeBtn.style.background='var(--surface)'; themeBtn.style.color='var(--text)'; themeBtn.style.boxShadow='0 10px 25px rgba(0,0,0,.35)';
        themeBtn.textContent = '🌓';
        themeBtn.addEventListener('click', ()=>{
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem('report-theme', next); } catch {}
        });
        document.body.appendChild(themeBtn);
    });
})();
