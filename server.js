<script>
(function(){
  const API_URL = "https://manisha-ai-backend.onrender.com/api/chat";
  const AI_LOG_WEBHOOK = "https://script.google.com/macros/s/AKfycby_XqNpFC-Uq0U3onshvrdpBKjmypqsiaWvbSTDOgUxLFz2VRyPzI5qm5AGW2rbRojZpA/exec";
  const AI_MANISHA_EMAIL = "manisha.varma.ux@gmail.com";
  const AI_MANISHA_LINKEDIN = "https://www.linkedin.com/in/manishavarmak/";
  const AI_MANISHA_CONTACT = "https://www.manishavarma.com/contact";

  const AI_CASE_STUDIES = [
    { label: "International Roaming Guardrails", url: "https://www.manishavarma.com/projects-manisha/ir" },
    { label: "OneButton PIN", url: "https://www.manishavarma.com/projects-manisha/onebuttonpin" },
    { label: "VibroAuth", url: "https://www.manishavarma.com/projects-manisha/vibroauth" },
    { label: "Secure Text", url: "https://www.manishavarma.com/projects-manisha/secure-text" },
    { label: "Automate Complex Workflows", url: "https://www.manishavarma.com/projects-manisha/workflow" },
    { label: "AutoPay Flexibility", url: "https://www.manishavarma.com/projects-manisha/apflex" },
    { label: "Red Apron", url: "https://www.manishavarma.com/projects-manisha/red-apron" }
  ];

  const launcher = document.getElementById('aijLauncher');
  const launcherText = document.getElementById('aijLauncherText');
  const launcherBadge = document.getElementById('aijLauncherBadge');
  const panel = document.getElementById('aijPanel');
  const closeBtn = document.getElementById('aijClose');
  const expandBtn = document.getElementById('aijExpand');
  const textarea = document.getElementById('aijTextarea');
  const sendBtn = document.getElementById('aijSend');
  const body = document.getElementById('aijBody');
  const chat = document.getElementById('aijChat');
  const typing = document.getElementById('aijTyping');
  const scoreWrap = document.getElementById('aijScoreWrap');
  const scoreNum = document.getElementById('aijScoreNum');
  const scoreFill = document.getElementById('aijScoreFill');
  const emptyBox = document.getElementById('aijEmptyBox');
  const modeToggle = document.getElementById('aijModeToggle');
  const designerTools = document.getElementById('aijDesignerTools');
  const recruiterTools = document.getElementById('aijRecruiterTools');
  const title = document.getElementById('aijTitle');
  const subtitle = document.getElementById('aijSubtitle');
  const hint = document.getElementById('aijHint');
  const currentModeText = document.getElementById('aijCurrentModeText');
  const toggleHelp = document.getElementById('aijToggleHelp');
  const modeLabel = document.getElementById('aijModeLabel');

  let isRecruiter = false;
  let isExpanded = false;
  let designerAction = "projects";
  let recruiterAction = "job-match";

  function getAISessionId() {
    let id = sessionStorage.getItem('ai_manisha_session_id');
    if (!id) {
      id = 'AIM-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      sessionStorage.setItem('ai_manisha_session_id', id);
    }
    return id;
  }

  function logAIChat(payload) {
    try {
      fetch(AI_LOG_WEBHOOK, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}
  }

  function syncActions(containerSelector, activeAction){
    document.querySelectorAll(containerSelector + ' .aij-action').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.action === activeAction);
    });
  }

  function isCaseStudyLinkRequest(text) {
    const value = (text || "").toLowerCase();
    return (
      value.includes("case study") ||
      value.includes("case studies") ||
      value.includes("project link") ||
      value.includes("portfolio link") ||
      value.includes("share link") ||
      value.includes("send link") ||
      value.includes("show projects") ||
      value.includes("show me your projects") ||
      value.includes("share your projects")
    );
  }

  function isRemoteRoleQuestion(text) {
    const value = (text || "").toLowerCase();
    return (
      value.includes("open to remote") ||
      value.includes("remote roles") ||
      value.includes("remote role") ||
      value.includes("remote opportunities") ||
      value.includes("remote positions") ||
      value.includes("are you remote") ||
      value.includes("do you work remote")
    );
  }

  function addCaseStudySelector() {
    const wrapper = document.createElement('div');
    wrapper.className = 'aij-msg ai';

    const label = document.createElement('div');
    label.className = 'aij-msg-label';
    label.textContent = 'AI Manisha';

    const bubble = document.createElement('div');
    bubble.className = 'aij-msg-bubble';

    const intro = document.createElement('div');
    intro.className = 'aij-formatted';
    intro.innerHTML = '<p><strong>Absolutely — here are my case studies. Pick one:</strong></p>';

    const row = document.createElement('div');
    row.className = 'aij-contact-direct-row';

    AI_CASE_STUDIES.forEach(item => {
      const a = document.createElement('a');
      a.className = 'aij-contact-direct-btn';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = item.label;
      row.appendChild(a);
    });

    bubble.appendChild(intro);
    bubble.appendChild(row);
    wrapper.appendChild(label);
    wrapper.appendChild(bubble);
    chat.appendChild(wrapper);

    emptyBox.style.display = 'none';
    body.scrollTop = body.scrollHeight;
  }

  function updateModeUI(){
    if(isRecruiter){
      modeLabel.textContent = 'Recruiter';
      currentModeText.textContent = 'Current mode: Recruiter';
      title.textContent = 'AI Recruiter Assistant';
      subtitle.textContent = 'Use quick actions or paste a job description';
      textarea.placeholder = recruiterAction === 'job-match' ? 'Paste a job description...' : 'Ask a recruiter question...';
      hint.textContent = 'Recruiter mode helps with job fit, location, work preferences, and contact information.';
      recruiterTools.style.display = 'block';
      designerTools.style.display = 'none';
      toggleHelp.textContent = 'Turn off to return to designer mode';
      launcherText.textContent = 'AI Manisha — Recruiter Mode';
      launcherBadge.textContent = 'RECRUITER';

      if(!chat.children.length){
        if(recruiterAction === 'job-match'){
          emptyBox.textContent = 'Paste a job description for a clear job match analysis, or use the quick actions for recruiter logistics.';
        } else if(recruiterAction === 'location'){
          emptyBox.textContent = 'Ask where Manisha is located.';
        } else if(recruiterAction === 'open-to-work'){
          emptyBox.textContent = 'Ask whether Manisha is open to remote roles, hybrid roles, relocation, or what she is looking for next.';
        } else if(recruiterAction === 'contact-info'){
          emptyBox.textContent = 'Ask how to contact Manisha.';
        }
      }
    } else {
      modeLabel.textContent = 'Designer';
      currentModeText.textContent = 'Current mode: Designer';
      title.textContent = 'AI Manisha';
      subtitle.textContent = 'Ask about projects, experience, process, contact info, or portfolio work';
      textarea.placeholder = 'Ask about Manisha’s work, experience, projects, or contact info...';
      hint.textContent = 'Designer mode answers portfolio questions. Recruiter mode helps with fit and candidate logistics.';
      recruiterTools.style.display = 'none';
      designerTools.style.display = 'block';
      toggleHelp.textContent = 'Turn on for recruiter analysis';
      launcherText.textContent = 'AI Manisha';
      launcherBadge.textContent = 'DESIGNER';

      if(!chat.children.length){
        if(designerAction === 'projects'){
          emptyBox.textContent = 'Ask about Manisha’s top projects and what each one demonstrates.';
        } else if(designerAction === 'design-process'){
          emptyBox.textContent = 'Ask how Manisha approaches ambiguous product problems, research, systems thinking, and design decisions.';
        } else if(designerAction === 'learn-ux'){
          emptyBox.textContent = 'Ask about Learn UX with Me, article topics, and what Manisha teaches through her content.';
        } else if(designerAction === 'design-system'){
          emptyBox.textContent = 'Ask how Manisha thinks about reusable patterns, structure, consistency, and design systems.';
        } else if(designerAction === 'contact-info'){
          emptyBox.textContent = 'Ask how to contact Manisha.';
        }
      }
    }

    modeToggle.checked = isRecruiter;
    syncActions('#aijDesignerActions', designerAction);
    syncActions('#aijRecruiterActions', recruiterAction);
  }

  function buildRecruiterPrompt(rawInput){
    const input = rawInput.trim();
    if(recruiterAction === 'location') return input || 'Where is Manisha located?';
    if(recruiterAction === 'open-to-work') return input || 'Is Manisha open to remote roles, and what is she looking for in her next role?';
    if(recruiterAction === 'contact-info') return input || 'How can I contact Manisha? Please provide her email, LinkedIn, and portfolio contact page.';
    return input;
  }

  function buildDesignerPrompt(rawInput){
    const input = rawInput.trim();
    if(designerAction === 'projects') return input || 'What are Manisha’s top portfolio projects and what does each project demonstrate?';
    if(designerAction === 'design-process') return input || 'What is Manisha’s design process when working through complex or ambiguous product problems?';
    if(designerAction === 'learn-ux') return input || 'What is Learn UX with Me and what kinds of UX topics does Manisha write or teach about there?';
    if(designerAction === 'design-system') return input || 'How does Manisha think about design systems, reusable patterns, and consistency across products?';
    if(designerAction === 'contact-info') return input || 'How can I contact Manisha? Please provide her email, LinkedIn, and portfolio contact page.';
    return input;
  }

  function extractScore(text){
    const m = text.match(/\b(\d{1,3})\s*%|\bscore[:\s]+(\d{1,3})/i);
    if(!m) return null;
    const v = parseInt(m[1] || m[2], 10);
    return (v >= 0 && v <= 100) ? v : null;
  }

  function escapeHtml(str){
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatAIText(text){
    const lower = text.toLowerCase();
    const isContactReply =
      lower.includes('contact') ||
      lower.includes('email') ||
      lower.includes('linkedin') ||
      lower.includes('portfolio');

    if (isContactReply) {
      return `
        <div class="aij-formatted aij-contact-direct">
          <p><strong>Here’s the fastest way to reach Manisha.</strong></p>
          <div class="aij-contact-direct-row">
            <a class="aij-contact-direct-btn" href="mailto:${AI_MANISHA_EMAIL}">Email Manisha</a>
            <a class="aij-contact-direct-btn" href="${AI_MANISHA_LINKEDIN}" target="_blank" rel="noopener">Open LinkedIn</a>
            <a class="aij-contact-direct-btn" href="${AI_MANISHA_CONTACT}" target="_blank" rel="noopener">Open Contact Page</a>
          </div>
        </div>
      `;
    }

    let html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^Match score:\s*(\d{1,3}%)/im, 'Match score: <span class="aij-keyline">$1</span>');

    const lines = html.split('\n');
    let out = [];
    let inList = false;

    lines.forEach(line=>{
      const trimmed = line.trim();
      if(/^[-•]\s+/.test(trimmed)){
        if(!inList){
          out.push('<ul>');
          inList = true;
        }
        out.push('<li>' + trimmed.replace(/^[-•]\s+/, '') + '</li>');
      } else {
        if(inList){
          out.push('</ul>');
          inList = false;
        }
        if(trimmed){
          out.push('<p>' + trimmed + '</p>');
        }
      }
    });

    if(inList) out.push('</ul>');
    return out.join('');
  }

  function addMessage(role, content, isFormatted){
    const wrapper = document.createElement('div');
    wrapper.className = 'aij-msg ' + role;

    const label = document.createElement('div');
    label.className = 'aij-msg-label';
    label.textContent = role === 'user' ? 'You' : 'AI Manisha';

    const bubble = document.createElement('div');
    bubble.className = 'aij-msg-bubble';

    if(role === 'ai' && isFormatted){
      bubble.innerHTML = '<div class="aij-formatted">' + formatAIText(content) + '</div>';
    } else {
      bubble.textContent = content;
    }

    wrapper.appendChild(label);
    wrapper.appendChild(bubble);
    chat.appendChild(wrapper);

    emptyBox.style.display = 'none';
    body.scrollTop = body.scrollHeight;
  }

  modeToggle.addEventListener('change', ()=>{
    isRecruiter = modeToggle.checked;
    updateModeUI();
  });

  expandBtn.addEventListener('click', ()=>{
    isExpanded = !isExpanded;
    panel.classList.toggle('is-max', isExpanded);
    expandBtn.textContent = isExpanded ? '⤡' : '⤢';
    expandBtn.setAttribute('aria-label', isExpanded ? 'Restore chat size' : 'Expand chat');
  });

  document.querySelectorAll('#aijDesignerActions .aij-action').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      designerAction = btn.dataset.action;
      updateModeUI();

      if(designerAction === 'projects'){
        textarea.value = 'What are Manisha’s top portfolio projects and what does each project demonstrate?';
      } else if(designerAction === 'design-process'){
        textarea.value = 'What is Manisha’s design process when working through complex or ambiguous product problems?';
      } else if(designerAction === 'learn-ux'){
        textarea.value = 'What is Learn UX with Me and what kinds of UX topics does Manisha write or teach about there?';
      } else if(designerAction === 'design-system'){
        textarea.value = 'How does Manisha think about design systems, reusable patterns, and consistency across products?';
      } else if(designerAction === 'contact-info'){
        textarea.value = 'How can I contact Manisha? Please provide her email, LinkedIn, and portfolio contact page.';
      }

      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight,130) + 'px';
    });
  });

  document.querySelectorAll('#aijRecruiterActions .aij-action').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      recruiterAction = btn.dataset.action;
      updateModeUI();

      if(recruiterAction === 'job-match'){
        textarea.value = '';
        textarea.placeholder = 'Paste a job description...';
      } else if(recruiterAction === 'location'){
        textarea.value = 'Where is Manisha located?';
      } else if(recruiterAction === 'open-to-work'){
        textarea.value = 'Are you open to remote roles?';
      } else if(recruiterAction === 'contact-info'){
        textarea.value = 'How can I contact Manisha? Please provide her email, LinkedIn, and portfolio contact page.';
      }

      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight,130) + 'px';
    });
  });

  launcher.addEventListener('click', ()=>{
    panel.classList.add('open');
    launcher.style.display = 'none';
    logAIChat({
      timestamp: new Date().toISOString(),
      sessionId: getAISessionId(),
      source: 'AI Manisha',
      eventType: 'panel_open',
      mode: isRecruiter ? 'recruiter' : 'designer',
      action: isRecruiter ? recruiterAction : designerAction,
      userMessage: '',
      aiReply: '',
      pageUrl: window.location.href
    });
    setTimeout(()=>textarea.focus(), 120);
  });

  closeBtn.addEventListener('click', ()=>{
    panel.classList.remove('open');
    panel.classList.remove('is-max');
    isExpanded = false;
    expandBtn.textContent = '⤢';
    launcher.style.display = 'flex';
  });

  textarea.addEventListener('input', ()=>{
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight,130) + 'px';
  });

  textarea.addEventListener('keydown', e=>{
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  async function sendMessage(){
    const rawInput = textarea.value.trim();
    if(!rawInput && (!isRecruiter || recruiterAction === 'job-match')){
      textarea.focus();
      return;
    }

    const finalMessage = isRecruiter ? buildRecruiterPrompt(rawInput) : buildDesignerPrompt(rawInput);

    addMessage('user', finalMessage, false);

    logAIChat({
      timestamp: new Date().toISOString(),
      sessionId: getAISessionId(),
      source: 'AI Manisha',
      eventType: 'user_message',
      mode: isRecruiter ? 'recruiter' : 'designer',
      action: isRecruiter ? recruiterAction : designerAction,
      userMessage: finalMessage,
      aiReply: '',
      pageUrl: window.location.href
    });

    textarea.value = '';
    textarea.style.height = '52px';

    if (isCaseStudyLinkRequest(finalMessage)) {
      addCaseStudySelector();

      logAIChat({
        timestamp: new Date().toISOString(),
        sessionId: getAISessionId(),
        source: 'AI Manisha',
        eventType: 'case_study_selector_shown',
        mode: isRecruiter ? 'recruiter' : 'designer',
        action: isRecruiter ? recruiterAction : designerAction,
        userMessage: finalMessage,
        aiReply: 'Case study selector shown',
        pageUrl: window.location.href
      });

      return;
    }

    if (isRecruiter && recruiterAction === 'open-to-work' && isRemoteRoleQuestion(finalMessage)) {
      const remoteReply = "Yes — I’m open to remote roles, and I’m also happy to consider strong hybrid opportunities.";
      addMessage('ai', remoteReply, true);

      logAIChat({
        timestamp: new Date().toISOString(),
        sessionId: getAISessionId(),
        source: 'AI Manisha',
        eventType: 'ai_reply',
        mode: 'recruiter',
        action: recruiterAction,
        userMessage: finalMessage,
        aiReply: remoteReply,
        pageUrl: window.location.href
      });

      return;
    }

    sendBtn.disabled = true;
    typing.style.display = 'block';

    if(!(isRecruiter && recruiterAction === 'job-match')){
      scoreWrap.style.display = 'none';
      scoreFill.style.width = '0%';
    }

    body.scrollTop = body.scrollHeight;

    try{
      const outputType = isRecruiter
        ? (recruiterAction === 'job-match'
            ? 'Match Analysis'
            : recruiterAction === 'location'
              ? 'Location'
              : recruiterAction === 'open-to-work'
                ? 'Open to Work'
                : recruiterAction === 'contact-info'
                  ? 'Contact Info'
                  : 'Relevant Work')
        : 'Relevant Work';

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          message: finalMessage,
          mode: isRecruiter ? 'recruiter' : 'designer',
          outputType,
          selectedSkills: []
        })
      });

      const data = await res.json();
      typing.style.display = 'none';

      const reply = data.reply || data.error || 'Something went wrong. Please try again.';
      addMessage('ai', reply, true);

      logAIChat({
        timestamp: new Date().toISOString(),
        sessionId: getAISessionId(),
        source: 'AI Manisha',
        eventType: 'ai_reply',
        mode: isRecruiter ? 'recruiter' : 'designer',
        action: isRecruiter ? recruiterAction : designerAction,
        userMessage: finalMessage,
        aiReply: reply,
        pageUrl: window.location.href
      });

      if(isRecruiter && recruiterAction === 'job-match'){
        const score = extractScore(reply);
        if(score !== null){
          scoreWrap.style.display = 'block';
          scoreNum.textContent = score + '%';
          setTimeout(()=>{ scoreFill.style.width = score + '%'; }, 80);
        } else {
          scoreWrap.style.display = 'none';
        }
      }
    } catch(err){
      typing.style.display = 'none';
      addMessage('ai', 'The assistant is unavailable right now. Please try again in a moment.', true);

      logAIChat({
        timestamp: new Date().toISOString(),
        sessionId: getAISessionId(),
        source: 'AI Manisha',
        eventType: 'ai_error',
        mode: isRecruiter ? 'recruiter' : 'designer',
        action: isRecruiter ? recruiterAction : designerAction,
        userMessage: finalMessage,
        aiReply: 'The assistant is unavailable right now. Please try again in a moment.',
        pageUrl: window.location.href
      });
    } finally {
      sendBtn.disabled = false;
      body.scrollTop = body.scrollHeight;
    }
  }

  updateModeUI();
})();
</script>
