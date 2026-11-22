/* =========================================================
   main.js —— 首页交互脚本
   包含：
   1. 顶部 SKILLS / AWARDS 数据
   2. 技能栈、获奖经历的渲染
   3. 主题切换、简历占位保护、页脚年份、回到顶部
   4. 滚动淡入与锚点平滑滚动
   ========================================================= */

/* ---------------------------------------------------------
   技能栈数据
   说明：以后增删技能，只改这个数组即可，页面会自动重新渲染。
   - category：分组标题
   - items：该组下的技能名称列表
   --------------------------------------------------------- */
const SKILLS = [
  {
    category: '编程语言',
    items: ['HTML5', 'CSS3', 'JavaScript', 'Python', 'Java']
  },
  {
    category: '框架与工具',
    items: ['Vue 3', 'Vite', 'Element Plus', 'MySQL', 'Git', 'VS Code']
  },
  {
    category: '其他能力',
    items: ['数据分析', 'Office 三件套', '文案写作']
  }
];

/* ---------------------------------------------------------
   获奖经历数据
   说明：以后增删奖项，只改这个数组即可，页面会自动重新渲染。
   每个对象的字段：
   - date       获奖时间，格式 YYYY.MM
   - name       奖项名称
   - organizer  赛事主办方
   - level      奖项等级，可选值：national / provincial / school
                对应 CSS 类 .level-national / .level-provincial / .level-school
   --------------------------------------------------------- */
const AWARDS = [
  {
    date: '2025.11',
    name: '全国大学生数学建模竞赛 · 国家二等奖',
    organizer: '中国工业与应用数学学会',
    level: 'national'
  },
  {
    date: '2025.06',
    name: '“挑战杯”广东省大学生课外学术科技作品竞赛 · 省级三等奖',
    organizer: '共青团广东省委员会',
    level: 'provincial'
  },
  {
    date: '2024.12',
    name: '校园数据分析挑战赛 · 校级一等奖',
    organizer: '学校教务处',
    level: 'school'
  }
];

/* 等级字段到「显示文字 + CSS 类名」的映射 */
const AWARD_LEVELS = {
  national: { label: '国家级', className: 'level-national' },
  provincial: { label: '省级', className: 'level-provincial' },
  school: { label: '校级', className: 'level-school' }
};

(() => {
  'use strict';

  /* -------------------------------------------------------
     一、渲染技能栈
     把 SKILLS 数组转换成「分组卡片 + 标签 chip」的 HTML，
     一次性插入 #skills-grid 容器。
     ------------------------------------------------------- */
  const renderSkills = () => {
    const grid = document.querySelector('#skills-grid');

    // 页面上没有技能容器时直接跳过，避免报错
    if (!grid) {
      return;
    }

    // 每个分组生成一张卡片，组内每个技能生成一个标签
    grid.innerHTML = SKILLS.map((group) => `
      <article class="skill-group">
        <h3 class="skill-group__title">${group.category}</h3>
        <ul class="skill-group__list">
          ${group.items.map((item) => `<li class="chip">${item}</li>`).join('')}
        </ul>
      </article>
    `).join('');
  };

  renderSkills();

  /* -------------------------------------------------------
     二、渲染获奖经历
     把 AWARDS 数组转换成时间线条目，插入 #awards-list。
     level 字段决定标签文字和对应的颜色类名。
     ------------------------------------------------------- */
  const renderAwards = () => {
    const list = document.querySelector('#awards-list');

    // 页面上没有时间线容器时直接跳过，避免报错
    if (!list) {
      return;
    }

    list.innerHTML = AWARDS.map((award) => {
      // 根据 level 取显示文字与类名，未匹配时退化为原始值、无额外颜色
      const level = AWARD_LEVELS[award.level] || {
        label: award.level,
        className: ''
      };

      return `
        <li class="timeline__item">
          <time class="timeline__date" datetime="${award.date.replace('.', '-')}">${award.date}</time>
          <span class="timeline__axis" aria-hidden="true"></span>
          <div class="timeline__content">
            <h3 class="timeline__name">${award.name}</h3>
            <p class="timeline__organizer">${award.organizer}</p>
            <span class="level-tag ${level.className}">${level.label}</span>
          </div>
        </li>
      `;
    }).join('');
  };

  renderAwards();

  // 全站共用的“减少动态效果”判断：滚动淡入与锚点滚动都会用到
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------
     三、主题切换
     初始主题已由 HTML 里的内联脚本提前写入 body.dark，
     这里负责按钮交互、无障碍状态、地址栏主题色与本地存储。
     ------------------------------------------------------- */
  const THEME_KEY = 'portfolio-theme';
  const themeToggle = document.querySelector('#theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  const syncThemeUI = (isDark) => {
    if (!themeToggle) {
      return;
    }
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? '切换到亮色主题' : '切换到暗色主题');

    // 同步移动端浏览器地址栏颜色：直接读取 CSS 变量对应的实际背景色
    if (themeMeta) {
      themeMeta.setAttribute('content', getComputedStyle(document.body).backgroundColor);
    }
  };

  // 页面加载时同步一次按钮状态（暗色可能来自本地记录或系统偏好）
  syncThemeUI(document.body.classList.contains('dark'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');

      // 记录用户选择，刷新后保持
      try {
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
      } catch (error) {
        /* 隐私模式下无法写入时忽略，仅当前页面生效 */
      }

      syncThemeUI(isDark);
    });
  }

  /* -------------------------------------------------------
     四、简历下载占位守护
     文件未上传时按钮带 is-disabled，点击只提示、不跳转，避免 404。
     上传 assets/resume.pdf 后，删除 HTML 中的 is-disabled 与
     aria-disabled 即可恢复真实下载。
     ------------------------------------------------------- */
  const resumeLink = document.querySelector('[data-resume]');
  const resumeHint = document.querySelector('#resume-hint');

  if (resumeLink) {
    const resumeDisabled = resumeLink.classList.contains('is-disabled') ||
      resumeLink.getAttribute('aria-disabled') === 'true';

    // 文件已就绪（按钮已启用）时，不再显示“待上传”提示
    if (!resumeDisabled && resumeHint) {
      resumeHint.hidden = true;
    }

    resumeLink.addEventListener('click', (event) => {
      const isDisabled = resumeLink.classList.contains('is-disabled') ||
        resumeLink.getAttribute('aria-disabled') === 'true';

      if (!isDisabled) {
        return;
      }

      event.preventDefault();
      if (resumeHint) {
        resumeHint.textContent = '简历文件暂未上传，请上传 assets/resume.pdf 后再试。';
      }
    });
  }

  /* -------------------------------------------------------
     五、页脚版权年份：自动使用当前年份
     ------------------------------------------------------- */
  const yearElement = document.querySelector('#copyright-year');
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  /* -------------------------------------------------------
     六、回到顶部
     滚动超过约 80% 视口高度后显示，点击时复用锚点平滑滚动。
     ------------------------------------------------------- */
  const backToTop = document.querySelector('#back-to-top');

  if (backToTop) {
    const toggleBackToTop = () => {
      const shouldShow = window.scrollY > window.innerHeight * 0.8;
      backToTop.classList.toggle('is-visible', shouldShow);
    };

    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    window.addEventListener('resize', toggleBackToTop);
    toggleBackToTop();

    // 点击后立即隐藏，避免回到顶部后按钮还停留一帧
    backToTop.addEventListener('click', () => {
      backToTop.classList.remove('is-visible');
    });
  }

  /* -------------------------------------------------------
     七、滚动淡入
     只观察带 .reveal 的区块（首屏 Hero 不加），进入视口后
     添加 .is-visible 并停止观察；用户开启减少动画时直接显示。
     ------------------------------------------------------- */
  const revealTargets = document.querySelectorAll('main > section.reveal, .site-footer.reveal');

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.1
    });

    revealTargets.forEach((target) => revealObserver.observe(target));

    // 兜底：快速滚动或锚点跳转时，若观察器回调延迟，直接显示已进入视口的区块，
    // 避免元素停留在半透明状态。
    const revealInView = () => {
      revealTargets.forEach((target) => {
        if (target.classList.contains('is-visible')) {
          return;
        }
        const rect = target.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
          target.classList.add('is-visible');
        }
      });
    };

    window.addEventListener('scroll', revealInView, { passive: true });
    window.addEventListener('resize', revealInView);
    revealInView();
  } else {
    // 不支持 IntersectionObserver 或用户要求减少动画：直接显示
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }

  /* -------------------------------------------------------
     八、锚点平滑滚动
     点击“查看项目 / 联系我”时滚动到对应区块。
     ------------------------------------------------------- */
  // 选中页面内所有以 # 开头的锚点链接
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');

      // 忽略空锚点（href="#"）
      if (!targetId || targetId === '#') {
        return;
      }

      const target = document.querySelector(targetId);

      // 目标区块不存在时，保留浏览器默认行为
      if (!target) {
        return;
      }

      // 阻止瞬间跳转，改为平滑滚动到目标区块顶部
      event.preventDefault();

      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });

      // 同步地址栏 hash，但不新增历史记录，避免“返回”需要点两次
      if (history.pushState) {
        history.pushState(null, '', targetId);
      }
    });
  });
})();
