# Stack OverGol

## 📊 Arquitetura e Fluxo de Dados
A documentação completa e detalhada do fluxo de engenharia de dados (incluindo tratamento de colunas, modelagem e decisões técnicas) pode ser acessada na aba Links Úteis:

Nosso pipeline de dados foi construído seguindo a Arquitetura Medalhão, garantindo governança, qualidade e alta performance no processamento analítico:  

📥 Origem (Landing): Ingestão de dados transacionais, cadastrais e logs de navegação em formato bruto (.csv).  
<img width="1919" height="907" alt="Captura de tela 2026-05-02 135221" src="https://github.com/user-attachments/assets/f7531f0c-c595-41ab-8547-7e63a499985e" />
<br>
<br>
🥉 Camada Bronze: Leitura automatizada via Spark e persistência do dado no formato Delta Table sem alterações morfológicas, garantindo o histórico exato da fonte.  
<img width="1919" height="910" alt="Captura de tela 2026-05-02 135234" src="https://github.com/user-attachments/assets/54a37788-b7cd-49ae-a862-1fc17406d7a0" />
<br>
<br>
🥈 Camada Silver: Fase de purificação estrutural. Aqui aplicamos regras de limpeza, padronização de strings, Regex, conversões de timestamps, limites lógicos, tratamento de nulos e desmembramento de IDs.  
<img width="1919" height="912" alt="Captura de tela 2026-05-02 135250" src="https://github.com/user-attachments/assets/b3e1eae4-bf19-4d6d-a867-0fc942106c8e" />
<br>
<br>
🥇 Camada Gold: Modelagem voltada ao negócio (Star Schema). Foram criadas tabelas de Dimensão (Cliente, Produto) e tabelas Fato (Vendas, Suporte, Avaliações, Eventos). O destaque é a tabela fato_360_cliente, que agrega KPIs como LTV, recência, NPS e tickets em uma visão unificada.
<img width="1917" height="911" alt="Captura de tela 2026-05-02 135312" src="https://github.com/user-attachments/assets/35f5af1f-611f-44a2-909f-9b04a15691b7" />
<br>
<br>
🚀 Entrega e Orquestração: A etapa final exporta os dados modelados para um banco SQLite local, entregando altíssima portabilidade e experiência zero-setup (serverless) para testes e consumo por ferramentas de BI. Tudo isso é orquestrado por uma DAG robusta com dependências seguras que roda diariamente à meia-noite.
<img width="1919" height="909" alt="Job Stack OverGol" src="https://github.com/user-attachments/assets/87f1fe1b-8da2-44a4-a029-119aab9a1e5c" />

## Links Úteis
[🔗 Documentação Completa - Fluxo de Dados](https://docs.google.com/document/d/18yvL57PG_jbHkyGUdaTNTt7RniZP6ozEwQV4HjiGE98/edit?usp=sharing)   
[🔗 Google Drive](https://drive.google.com/drive/folders/1Xl3bOmaR3oNsEva4D6Q_mMzl0KPIyVu6?usp=sharing)
