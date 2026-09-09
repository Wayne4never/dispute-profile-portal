# 公开纠纷与关系检索台

这是一个面向中国大陆公司、机构、品牌、人物和案号的公开证据检索原型。前端可放在 GitHub Pages，后端使用 Cloudflare Workers Free。

## 架构

- `index.html`：GitHub Pages 前端。
- `worker/src/index.js`：Cloudflare Worker API。
- `worker/wrangler.toml`：Worker 配置。

## API

- `GET /health`
- `GET /api/search?q=上海某某科技有限公司`

后端会自动扩展法院/判决、执行风险、行政处罚、工商线索、新闻官网等检索词，并对公开结果做去重、来源分级、分类和时间线提取。

## 零付费模式

当前版本不要求付费 API Key。它会尝试使用公开搜索结果接口并进行降级处理，因此稳定性和覆盖度不等同于商业搜索 API。后续可以在不改前端的情况下接入正规搜索 API。

## Cloudflare 部署

1. 登录 Cloudflare Dashboard。
2. Workers & Pages → Create → Worker。
3. 可直接复制 `worker/src/index.js`，或用 Wrangler 部署。
4. 部署后会获得 `https://xxx.workers.dev` 地址。
5. 打开 GitHub Pages，在“后端 API”中填入该地址一次，浏览器会记住。

## 证据规则

- 事实：有可追溯来源直接支持。
- 推断：必须展示依据和置信度。
- 主观评价：只能作为来源观点展示，不能自动升级为事实。
- 未核实的“跑路、诈骗、卷款、失联”等指控不得标记为事实。
- 不收集或推断身份证号、家庭住址、私人手机号、实时位置等敏感个人信息。
