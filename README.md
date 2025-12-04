# 🛡️ OWASP API Security Lab

Vulnerable API lab untuk belajar **OWASP API Security Top 10 (2023)**. Dilengkapi dengan 10 CTF flags untuk setiap vulnerability.

> ⚠️ **Warning:** Intentionally vulnerable. Jangan deploy ke production!

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/gethuksec/gethuksec-api-lab.git
cd gethuksec-api-lab

# Run dengan Docker (recommended)
docker-compose up -d --build

# Atau tanpa Docker
npm install
npm run dev
```

**Akses:**
- 🌐 API: http://localhost:3000
- 📖 Guide: https://api-lab.gethuksec.id/guide.html
- 📚 Docs: http://localhost:3000/api/docs

## 🎯 Vulnerabilities

| # | Vulnerability | Flag |
|---|--------------|------|
| API1 | Broken Object Level Authorization | ✅ |
| API2 | Broken Authentication | ✅ |
| API3 | Broken Object Property Level Authorization | ✅ |
| API4 | Unrestricted Resource Consumption | ✅ |
| API5 | Broken Function Level Authorization | ✅ |
| API6 | Unrestricted Access to Sensitive Business Flows | ✅ |
| API7 | Server Side Request Forgery | ✅ |
| API8 | Security Misconfiguration | ✅ |
| API9 | Improper Inventory Management | ✅ |
| API10 | Unsafe Consumption of APIs | ✅ |

## 📁 Struktur

```
├── src/              # Backend API (Express + TypeScript)
├── guide.html        # Interactive exploitation guide
├── Dockerfile        # Container build
└── docker-compose.yml
```

## 🔐 Default Credentials

| User | Password | Role |
|------|----------|------|
| alice | alice123 | user |
| bob | bob123 | user |
| admin | admin123 | admin |
| weakpass | 123456 | user |

## 📖 Dokumentasi

- [Deployment Guide](DEPLOY.md) - Cara deploy ke server
- [OWASP API Security](https://owasp.org/API-Security/) - Referensi resmi

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite
- **Auth:** JWT
- **Container:** Docker

---

**Built with ❤️ by [Gethuk Security](https://gethuksec.id)**

