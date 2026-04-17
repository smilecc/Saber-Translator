# src/app/ Flask应用层

**职责**: API路由、静态文件服务、错误处理、蓝图注册

## 结构

```
src/app/
├── __init__.py          # 主蓝图 + 蓝图注册器
├── routes.py            # Vue SPA路由服务
├── error_handlers.py    # 全局错误处理
├── route_redirects.py   # 旧API重定向(307)
└── api/
    ├── __init__.py      # 聚合9个API蓝图
    ├── api_docs.py      # Swagger/Flasgger
    ├── config_api.py    # 配置管理
    ├── session_api.py   # 会话管理
    ├── bookshelf_api.py # 书架RESTful API
    ├── page_storage_api.py
    ├── web_import_api.py
    ├── translation/     # 翻译API(核心)
    ├── system/          # 系统API
    └── manga_insight/   # 分析API
```

## 蓝图注册

分层模块化:
1. 各子模块创建 `Blueprint(..., url_prefix='...')`
2. `api/__init__.py` 收集到 `all_blueprints`
3. `__init__.py` 注册 `main_bp` + `all_blueprints`

**蓝图列表**:
- `translate_bp` / `config_bp` / `system_bp` / `parallel_bp`: `/api`
- `session_bp`: `/api/sessions`
- `bookshelf_bp`: `/api/bookshelf`
- `manga_insight_bp`: `/api/manga-insight`

## 错误处理

集中式 `error_handlers.py`:
- 业务异常: ValidationException, ResourceNotFoundException, DetectionException, OCRException, TranslationException, InpaintingException, RenderingException, SessionException, PluginException, ConfigurationException, APIException
- 全部返回JSON: `{'error': 'Type', 'message': '...'}`
- 状态码: 400/404/500/502

## 静态文件

- `static_folder='src/app/static'`, `static_url_path=''`
- Vue构建产物: `static/vue/`
- 字体: `static/fonts/`
- 所有页面路由返回 `index.html`(Vue Router接管)

## API风格

- 无版本号(无 `/api/v1/`)
- 混合: RESTful(bookshelf) + RPC(translation/config)
- 响应: `{'success': bool, 'data': ...}` 或直接 `{key: value}`
- Swagger文档: `/api/docs`
