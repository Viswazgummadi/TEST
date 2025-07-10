reploit/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── ai_core/
│   │   │   ├── agent.py
│   │   │   └── tools.py
│   │   ├── code_parse/
│   │   │   └── python_parser.py
│   │   ├── core_config/
│   │   │   └── static_model_data.py
│   │   ├── knowledge_graph/
│   │   │   └── kg_manager.py
│   │   ├── models/
│   │   │   └── models.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── admin_routes.py
│   │   │   ├── chat_routes.py
│   │   │   ├── data_source_routes.py
│   │   │   ├── faq_routes.py
│   │   │   ├── general_routes.py
│   │   │   ├── github_routes.py
│   │   │   └── google_routes.py
│   │   ├── tasks/
│   │   │   └── repo_ingestion_task.py
│   │   ├── utils/
│   │   │   └── auth.py
│   │   │   └── file_reader.py
│   │   └── vector_db/
│   │       └── vector_store_manager.py
│   ├── celery_worker.py
│   ├── config.py
│   ├── instance/
│   ├── migrations/
│   │   └── env.py
│   ├── procfile
│   ├── repos_cloned/
│   ├── requirements.txt
│   ├── run.py
│   └── .env
├── node_modules/
├── public/
│   └── feature1-4.png
├── src/
│   ├── App.css
│   ├── App.jsx
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── AdminLoginForm.jsx
│   │   ├── ChatInputBar.jsx
│   │   ├── CloudSelector.jsx
│   │   ├── CodeBlock.jsx
│   │   ├── ConnectRepoModal.jsx
│   │   ├── ConversationView.jsx
│   │   ├── DataSourceCard.jsx
│   │   ├── FeatureCard.jsx
│   │   ├── FeatureSection.jsx
│   │   ├── FlowModal.jsx
│   │   ├── GoogleFilesModal.jsx
│   │   ├── GuideSection.jsx
│   │   ├── HistoryItem.jsx
│   │   ├── HistoryList.jsx
│   │   ├── InitialPrompt.jsx
│   │   ├── LangGraph.jsx
│   │   ├── Logo.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── ModelManagement.jsx
│   │   ├── ModelSelector.jsx
│   │   ├── PageLayout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RepoCard.jsx
│   │   ├── RepoList.jsx
│   │   ├── Sidebar.jsx
│   │   ├── TraceEmbed.jsx
│   │   ├── UniversalHeader.jsx
│   │   └── UniversalSelector.jsx
│   ├── context/
│   │   └── AdminContext.jsx
│   ├── data/
│   │   ├── homePageFeatures.js
│   │   ├── implementationSteps.js
│   │   ├── mockFaqs.js
│   │   ├── mockHistory.js
│   │   └── mockRepos.js
│   ├── index.css
│   ├── main.jsx
│   ├── navigation.js
│   ├── pages/
│   │   ├── AdminHistoryPage.jsx
│   │   ├── AdminSettingsPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── DeploymentPage.jsx
│   │   ├── HistoryPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── ImplementationPage.jsx
│   │   └── ReposPage.jsx
│   └── utils/
│       └── api.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.cjs
├── tailwind.config.js
└── vite.config.js