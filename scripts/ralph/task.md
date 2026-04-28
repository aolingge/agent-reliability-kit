# Long Task Request

Created: 2026-04-28T17:50:41

```text
把 agent-reliability-kit 做成 AI-agent 可靠性总入口，并以 agent-secret-guard 为安全卖点补齐商业化与分发能力。范围：1) 增加付费团队层的本地可用 MVP：扫描历史、team policy、audit report、Slack webhook payload/配置示例、私有 allowlist 配置与校验；2) 增加私有 MCP registry/allowlist 扫描：批准 server、权限、trust score、风险原因；3) 增加 n8n safety + backup：扫描 workflow JSON 中公开 webhook、危险 code/executeCommand 节点、secret-like 值，并支持备份到本地 git-friendly 目录；4) 增加 AI cost guard 与 trace 结合的本地 MVP：解析 trace/cost fixture、预算告警、模型/provider 汇总；5) 完善真正分发材料：README hero/quickstart、对比页、Show HN/Reddit/MCP directory/awesome list 文案、GIF/demo 脚本、商业支持说明；6) 把小工具矩阵收敛为 ark 子命令或清晰路线图。禁止发布 npm、创建 GitHub release、push 远端、写入真实密钥。每轮完成后跑 npm run check 和最相关 smoke。
```
