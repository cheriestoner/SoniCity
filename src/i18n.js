(function () {
  const TRANSLATIONS = {
    en: {
      app_title:             'Urban Sound Diary',
      tagline:               'Listen, compose, and share your city.',
      username_placeholder:  'Username',
      city_placeholder:      'City (e.g. Suzhou)',
      set:                   'Set',
      change:                'Change',
      start_listening:       'Start Listening',
      compose:               'Compose',
      alert_enter_username:  'Please enter a username',
      no_city_set:           'no city set',

      new_moment:            'New Moment',
      tap_to_record:         'TAP TO RECORD',
      tap_to_stop:           'TAP TO STOP',
      recorded:              'RECORDED',
      re_record:             'Re-record',
      add_photo:             'Add Photo',
      retake:                'Retake',
      take_photo:            'Take Photo',
      what_hear:             'What do you hear?',
      describe_moment:       'Describe this moment...',
      what_feel:             'What do you feel?',
      describe_feel:         'Describe how this makes you feel...',
      time_label:            'Time',
      place_label:           'Place',
      name_place:            'Name this place…',
      tag_label:             'Tags',
      tag_on_the_way:        'On the way',
      tag_open_space:        'Open space',
      tag_commercial:        'Commercial space',
      tag_historical:        'Historical place',
      tag_special:           'Place special to me',
      tag_special_placeholder: 'Describe…',
      save_moment:           'Save Moment',
      record_to_save:        'Record audio to save',
      mic_denied:            'Microphone access denied.',
      cam_denied:            'Camera access denied.',
      locating:              'Locating…',
      no_location:           'No location',
      footer_title:          'Urban Sound Diary',

      city_a:                'City A',
      home_back:             '← Home',
      city_a_archive:        'City A Sound Archive',
      city_a_desc:           'A collective sound diary — three participants recording 1–3 moments each day over seven days in City A.',
      view_label:            'View',
      scatter:               'Scatter',
      timeline:              'Timeline',
      clock:                 'Clock',
      user_label:            'User',
      all:                   'All',
      what_i_hear:           'What I hear',
      what_i_feel:           'What I feel',
      location_label:        'Location',
      morning:               'Morning',
      afternoon:             'Afternoon',
      evening:               'Evening',
      night:                 'Night',
      day_n:                 'Day {n}',
      moment_time:           '{period} Moment – {time}',
    },
    zh: {
      app_title:             '城市声音日记',
      tagline:               '聆听、创作，分享你的城市。',
      username_placeholder:  '用户名',
      city_placeholder:      '城市（如：苏州）',
      set:                   '确认',
      change:                '修改',
      start_listening:       '开始聆听',
      compose:               '创作',
      alert_enter_username:  '请输入用户名',
      no_city_set:           '未设置城市',

      new_moment:            '新时刻',
      tap_to_record:         '点击录音',
      tap_to_stop:           '点击停止',
      recorded:              '已录制',
      re_record:             '重新录音',
      add_photo:             '添加照片',
      retake:                '重拍',
      take_photo:            '拍照',
      what_hear:             '你听到了什么？',
      describe_moment:       '描述这个时刻...',
      what_feel:             '你有什么感受？',
      describe_feel:         '描述你的感受...',
      time_label:            '时间',
      place_label:           '地点',
      name_place:            '为这个地点命名…',
      tag_label:             '标签',
      tag_on_the_way:        '在路上',
      tag_open_space:        '开放空间',
      tag_commercial:        '商业空间',
      tag_historical:        '历史空间',
      tag_special:           '对我有特殊意义',
      tag_special_placeholder: '描述…',
      save_moment:           '保存时刻',
      record_to_save:        '录音后方可保存',
      mic_denied:            '麦克风访问被拒绝。',
      cam_denied:            '摄像头访问被拒绝。',
      locating:              '定位中…',
      no_location:           '无位置信息',
      footer_title:          '城市声音日记',

      city_a:                '城市A',
      home_back:             '← 主页',
      city_a_archive:        '城市A声音档案',
      city_a_desc:           '一个集体声音日记 — 三名参与者在城市A进行了七天，每天记录1至3个时刻。',
      view_label:            '视图',
      scatter:               '散点',
      timeline:              '时间线',
      clock:                 '时钟',
      user_label:            '用户',
      all:                   '全部',
      what_i_hear:           '我听到的',
      what_i_feel:           '我的感受',
      location_label:        '位置',
      morning:               '早晨',
      afternoon:             '下午',
      evening:               '傍晚',
      night:                 '夜晚',
      day_n:                 '第{n}天',
      moment_time:           '{period}时刻 – {time}',
    },
  };

  function getLang() {
    return localStorage.getItem('usd_lang') || 'en';
  }

  function t(key) {
    const lang = getLang();
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
  }

  function applyTranslations() {
    const lang = getLang();
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      const val = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key];
      if (val !== undefined) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key];
      if (val !== undefined) el.placeholder = val;
    });
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
  }

  function setLang(lang) {
    localStorage.setItem('usd_lang', lang);
    applyTranslations();
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  window.i18n = { t: t, getLang: getLang, setLang: setLang, applyTranslations: applyTranslations };
})();
