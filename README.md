# Proxy Server (ly-proxy)

Servidor de proxy reverso e balanceador de carga do ecossistema Lytex, responsável por unificar o roteamento das requisições para os microsserviços. No caso do desafio, só deu tempo de criar um microsserviço, mas a ideia era destrinchar a parte de autenticação (login/registro/JWT) em um ly-security, mas não deu tempo: preferi focar em alcançar excelência melhor no ly-services que ter que preocupar com um microsserviço a mais.

---

## 1. Arquitetura e Tecnologias

- **Servidor Web**: NGINX
- **Segurança**: SSL, CORS e Headers de Segurança
- **Implantação**: Docker container

---

## 2. Requisitos Atendidos

- **Roteamento Dinâmico**: interliga-se ao backend `ly-services`.

---

## 3. Execução

O proxy é parte exposts na infraestrutura do Komodo, responsável por unificar o acesso externo aos microsserviços.
