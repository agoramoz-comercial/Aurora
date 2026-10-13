# Modelo de Instruções Avançadas — VS Code + IA Full-Stack (MIA‑VS)

Este é um modelo sénior, token‑eficiente, para guiar agentes de IA dentro do ecossistema VS Code. Ele integra:

- VS Code (Command Palette, Tasks, Debug, Source Control, Terminal, Snippets, Remote, Profiles, Extensions, Webviews, LSP, DAP)
- Extensões e MCPs (Model Context Protocol)
- Lógica de programação sénior, full‑stack, automação, arquitetura, engenharia, harness, loops, prompt engineering, graphs
- Cibersegurança, websites, software, AI Automation, AI Agents, Visão Computacional, Robótica, ML, DL e Aprendizagem Quântica avançada.

---

## 1. Princípios Token‑Eficientes

1. **Nunca duplique conhecimento** — use referências simbólicas (`src:`, `doc:`, `mcp:`, `vscode:`) em vez de colar texto longo.
2. **Carregamento preguiçoso** — traga apenas o chunk relevante da documentação.
3. **Compressão semântica** — substitua explicações por schemas, tabelas e grafos.
4. **Orçamento de tokens explícito** — todo prompt final deve caber em `max_tokens` definido.
5. **Cache e reutilização** — mantenha chunks já carregados em memória/LRU.
6. **Pipeline determinístico** — use grafos dirigidos e loops com condição de saída clara.
7. **Saída estruturada** — exija JSON/YAML para que o agente não desperdice tokens com prosa.

---

## 2. Formato Compacto de Instrução (YAML/JSON)

```yaml
# @MIA-VS:1
mission: "criar_api_fastapi"
role: "senior_fullstack_agent"
stack:
  - fastapi
  - postgres
  - redis
  - docker
vscode:
  settings: "python.defaultInterpreterPath=.venv/bin/python"
  tasks: [".vscode/tasks.json"]
  extensions: ["ms-python.python", "ms-azuretools.vscode-docker"]
mcp_servers:
  - filesystem
  - github
  - postgres
context:
  - src: "./docs/api_spec.md"
    chunk: 2
  - src: "https://fastapi.tiangolo.com/tutorial/"
    selector: "#path-params"
    max_tokens: 600
pipeline:
  - step: design_schema
    graph: ["User", "Post", "Comment"]
    output: "/tmp/schema.json"
  - step: generate_code
    use: ["mcp:filesystem", "mcp:github"]
    guard: ["ruff", "mypy"]
  - step: test
    loop: "until_tests_green"
    max_iterations: 5
  - step: security_scan
    tools: ["bandit", "pip-audit"]
sources:
  - "https://code.visualstudio.com/api"
  - "https://modelcontextprotocol.io"
  - "https://fastapi.tiangolo.com"
  - "https://docs.python.org/3/"
  - "https://scikit-learn.org/stable/"
  - "https://pytorch.org/docs/"
  - "https://qiskit.org/documentation/"
```

---

## 3. Fontes e Documentação Recomendadas

| Área | Fonte Oficial |
|------|---------------|
| VS Code API | https://code.visualstudio.com/api |
| VS Code Extension API | https://code.visualstudio.com/api/references/vscode-api |
| Language Server Protocol | https://microsoft.github.io/language-server-protocol/ |
| Debug Adapter Protocol | https://microsoft.github.io/debug-adapter-protocol/ |
| MCP (Model Context Protocol) | https://modelcontextprotocol.io |
| Python | https://docs.python.org/3/ |
| FastAPI | https://fastapi.tiangolo.com |
| PostgreSQL | https://www.postgresql.org/docs/ |
| Redis | https://redis.io/docs/ |
| Docker | https://docs.docker.com |
| ML / Scikit‑learn | https://scikit-learn.org/stable/ |
| Deep Learning / PyTorch | https://pytorch.org/docs/ |
| Visão Computacional / OpenCV | https://docs.opencv.org/4.x/ |
| Robótica / ROS 2 | https://docs.ros.org/en/rolling/ |
| Cibersegurança / OWASP | https://owasp.org |
| Quantum / Qiskit | https://qiskit.org/documentation/ |

---

## 4. Código Python Avançado — Compilador de Instruções Token‑Eficiente

O código abaixo lê um spec compacto (YAML/JSON), resolve fontes, corta chunks relevantes, ordena o pipeline e gera um prompt final otimizado para não estourar o orçamento de tokens.

```python
#!/usr/bin/env python3
"""
MIA-VS Token-Efficient Instruction Compiler
===========================================
Compila instruções compactas (YAML/JSON) em prompts otimizados para agentes de IA
operando no VS Code + MCPs. Usa orçamento de tokens, cache LRU, chunking semântico
e ordenação topológica do pipeline.

Autor: VS Code Senior Specialist
"""

from __future__ import annotations

import json
import re
import hashlib
import heapq
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from collections import OrderedDict, deque

try:
    import yaml  # pip install pyyaml
except ImportError:
    yaml = None

try:
    import tiktoken  # pip install tiktoken
except ImportError:
    tiktoken = None


# ----------------------------------------------------------------------
# Token Budget
# ----------------------------------------------------------------------
@dataclass
class TokenBudget:
    max_tokens: int = 8000          # limite total do prompt
    reserve_system: int = 600       # reserva para instruções fixas
    reserve_output: int = 1200      # reserva para resposta do modelo
    reserve_pipeline: int = 500     # reserva para descrição do pipeline
    safety_margin: float = 0.95     # margem de segurança

    @property
    def context_budget(self) -> int:
        used = self.reserve_system + self.reserve_output + self.reserve_pipeline
        return int((self.max_tokens - used) * self.safety_margin)


# ----------------------------------------------------------------------
# Estimativa de tokens
# ----------------------------------------------------------------------
def estimate_tokens(text: str) -> int:
    """Estima tokens. Usa tiktoken se disponível; caso contrário, heurística."""
    if tiktoken:
        try:
            enc = tiktoken.get_encoding("cl100k_base")
            return len(enc.encode(text))
        except Exception:
            pass
    # Heurística: ~4 caracteres por token para inglês; para português ~3.5
    return int(len(text) / 3.5)


# ----------------------------------------------------------------------
# Cache LRU simples
# ----------------------------------------------------------------------
class LRUCache:
    def __init__(self, capacity: int = 128):
        self.capacity = capacity
        self.cache: OrderedDict[str, str] = OrderedDict()

    def get(self, key: str) -> Optional[str]:
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: str, value: str) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)


# ----------------------------------------------------------------------
# Chunking e scoring
# ----------------------------------------------------------------------
def chunk_text(text: str, max_chunk_tokens: int = 500, overlap: int = 50) -> List[str]:
    """Divide texto em chunks com sobreposição, respeitando limite de tokens."""
    words = text.split()
    chunks = []
    current = []
    current_tokens = 0
    for word in words:
        w_tokens = estimate_tokens(word) + 1
        if current_tokens + w_tokens > max_chunk_tokens and current:
            chunks.append(" ".join(current))
            # sobreposição simples
            overlap_words = current[-overlap:] if overlap > 0 else []
            current = overlap_words[:]
            current_tokens = sum(estimate_tokens(w) + 1 for w in current)
        current.append(word)
        current_tokens += w_tokens
    if current:
        chunks.append(" ".join(current))
    return chunks


def score_chunk(chunk: str, keywords: List[str]) -> float:
    """BM25 simplificado: pontuação baseada em frequência de termos."""
    if not keywords:
        return 0.0
    text_lower = chunk.lower()
    score = 0.0
    for kw in keywords:
        kw_lower = kw.lower()
        count = text_lower.count(kw_lower)
        if count > 0:
            # tf simples + bônus por keyword completa
            score += count * (1 + len(kw_lower) / 100)
    # normaliza pelo tamanho do chunk para evitar chunks longos demais
    return score / (1 + estimate_tokens(chunk) / 500)


# ----------------------------------------------------------------------
# Compilador de Instruções
# ----------------------------------------------------------------------
@dataclass
class InstructionCompiler:
    spec_path: Path
    doc_root: Path = Path(".")
    budget: TokenBudget = field(default_factory=TokenBudget)
    cache: LRUCache = field(default_factory=lambda: LRUCache(128))

    # ------------------------------------------------
    # Leitura do spec
    # ------------------------------------------------
    def load_spec(self) -> Dict[str, Any]:
        text = self.spec_path.read_text(encoding="utf-8")
        if self.spec_path.suffix in (".yaml", ".yml"):
            if yaml is None:
                raise ImportError("PyYAML é necessário para specs YAML. pip install pyyaml")
            return yaml.safe_load(text)
        return json.loads(text)

    # ------------------------------------------------
    # Resolução de fontes (local ou HTTP simples)
    # ------------------------------------------------
    def resolve_source(self, src: str) -> str:
        cached = self.cache.get(src)
        if cached:
            return cached
        content = ""
        if src.startswith("http://") or src.startswith("https://"):
            # Em produção, use httpx ou requests; aqui evitamos dependências pesadas
            import urllib.request
            try:
                with urllib.request.urlopen(src, timeout=10) as resp:
                    content = resp.read().decode("utf-8", errors="ignore")
            except Exception as e:
                content = f"[ERRO AO CARREGAR FONTE: {e}]"
        else:
            path = self.doc_root / src
            if path.exists():
                content = path.read_text(encoding="utf-8", errors="ignore")
            else:
                content = f"[FONTE NÃO ENCONTRADA: {src}]"
        self.cache.put(src, content)
        return content

    # ------------------------------------------------
    # Extração de keywords da missão e stack
    # ------------------------------------------------
    def extract_keywords(self, spec: Dict[str, Any]) -> List[str]:
        keywords = []
        mission = spec.get("mission", "")
        keywords.extend(re.findall(r"[A-Za-zÀ-ÿ0-9_]{3,}", mission))
        stack = spec.get("stack", [])
        if isinstance(stack, list):
            keywords.extend([str(s) for s in stack])
        # remove duplicatas mantendo ordem
        seen = set()
        unique = []
        for kw in keywords:
            if kw.lower() not in seen:
                seen.add(kw.lower())
                unique.append(kw)
        return unique

    # ------------------------------------------------
    # Seleção dos melhores chunks
    # ------------------------------------------------
    def select_relevant_chunks(
        self, source_text: str, keywords: List[str], max_tokens: int
    ) -> List[str]:
        chunks = chunk_text(source_text, max_chunk_tokens=500)
        scored = [(score_chunk(c, keywords), c) for c in chunks]
        scored.sort(key=lambda x: x[0], reverse=True)
        selected = []
        used_tokens = 0
        for score, chunk in scored:
            if score <= 0:
                continue
            ct = estimate_tokens(chunk)
            if used_tokens + ct > max_tokens:
                continue
            selected.append(chunk)
            used_tokens += ct
        return selected

    # ------------------------------------------------
    # Ordenação topológica do pipeline (grafo de passos)
    # ------------------------------------------------
    def topological_pipeline(self, steps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Ordena passos respeitando dependências declaradas em 'depends_on'."""
        name_to_step = {}
        for i, step in enumerate(steps):
            name = step.get("name") or step.get("step") or f"step_{i}"
            step["_name"] = name
            name_to_step[name] = step

        in_degree = {name: 0 for name in name_to_step}
        adjacency: Dict[str, List[str]] = {name: [] for name in name_to_step}

        for step in steps:
            name = step["_name"]
            for dep in step.get("depends_on", []):
                if dep in name_to_step:
                    adjacency[dep].append(name)
                    in_degree[name] += 1

        queue = deque([n for n, d in in_degree.items() if d == 0])
        ordered = []
        while queue:
            current = queue.popleft()
            ordered.append(name_to_step[current])
            for neighbor in adjacency[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(ordered) != len(steps):
            raise ValueError("Pipeline contém dependências circulares!")

        # remove campo temporário
        for step in ordered:
            step.pop("_name", None)
        return ordered

    # ------------------------------------------------
    # Compilação final do prompt
    # ------------------------------------------------
    def compile(self) -> str:
        spec = self.load_spec()
        budget = self.budget
        keywords = self.extract_keywords(spec)

        # 1. Contexto das fontes
        context_parts: List[str] = []
        context_specs = spec.get("context", [])
        remaining = budget.context_budget

        for ctx in context_specs:
            if remaining <= 0:
                break
            src = ctx.get("src", "")
            max_tokens = min(
                ctx.get("max_tokens", 800),
                remaining
            )
            text = self.resolve_source(src)
            selected = self.select_relevant_chunks(text, keywords, max_tokens)
            for chunk in selected:
                chunk_tokens = estimate_tokens(chunk)
                if remaining - chunk_tokens < 0:
                    break
                context_parts.append(
                    f"### FONTE: {src}\n{chunk}"
                )
                remaining -= chunk_tokens

        context_block = "\n\n".join(context_parts)

        # 2. Pipeline ordenado
        raw_steps = spec.get("pipeline", [])
        ordered_steps = self.topological_pipeline(raw_steps)
        pipeline_lines = []
        for i, step in enumerate(ordered_steps, 1):
            pipeline_lines.append(
                f"{i}. {json.dumps(step, ensure_ascii=False)}"
            )
        pipeline_block = "\n".join(pipeline_lines)

        # 3. Fontes/documentação
        sources_block = "\n".join(f"- {s}" for s in spec.get("sources", []))

        # 4. Prompt final
        prompt = f"""
[PERFIL]
Você é um agente sénior operando no VS Code com acesso a extensões, MCPs e terminal.
Siga rigorosamente o Modelo MIA‑VS. Produza respostas estruturadas em JSON quando solicitado.
Não invente APIs; use apenas as fontes fornecidas.

[MISSÃO]
{spec.get('mission', '')}

[STACK]
{json.dumps(spec.get('stack', []), ensure_ascii=False)}

[CONTEXTO RELEVANTE]
{context_block or '[Nenhum contexto adicional carregado — use fontes sob demanda]'}

[PIPELINE ORDENADO]
{pipeline_block or '[Pipeline não definido]'}

[FONTES E DOCUMENTAÇÃO]
{sources_block or '[Use as fontes oficiais listadas no perfil]'}

[REGRAS TOKEN‑EFICIENTES]
- Não repita informações já presentes.
- Use referências simbólicas ao invés de colar código longo.
- Se precisar de mais contexto, solicite explicitamente via `mcp:filesystem` ou `mcp:github`.
- Responda apenas o que for pedido; evite explicações desnecessárias.

[SAÍDA ESPERADA]
JSON válido com os campos: `status`, `artefatos`, `logs`, `próximos_passos`.
"""
        # Verificação final do orçamento
        total_estimate = estimate_tokens(prompt)
        if total_estimate > budget.max_tokens:
            # Fallback: corta fontes excedentes
            excess = total_estimate - budget.max_tokens
            prompt = prompt[: -excess * 4]  # corte bruto baseado em chars/token
            prompt += "\n[CONTEXTO TRUNCADO POR ORÇAMENTO DE TOKENS]"
        return prompt.strip()


# ----------------------------------------------------------------------
# Exemplo de uso
# ----------------------------------------------------------------------
if __name__ == "__main__":
    # Crie um arquivo spec.yaml no mesmo diretório
    example_spec = Path("spec.yaml")
    if not example_spec.exists():
        example_spec.write_text(
            """
mission: "criar_api_fastapi"
stack: [fastapi, postgres, redis, docker]
context:
  - src: "./docs/api_spec.md"
    max_tokens: 600
  - src: "https://fastapi.tiangolo.com/tutorial/"
    max_tokens: 800
pipeline:
  - step: design_schema
    graph: ["User", "Post", "Comment"]
  - step: generate_code
    depends_on: [design_schema]
    guard: ["ruff", "mypy"]
  - step: test
    depends_on: [generate_code]
    loop: "until_tests_green"
    max_iterations: 5
sources:
  - "https://code.visualstudio.com/api"
  - "https://modelcontextprotocol.io"
  - "https://fastapi.tiangolo.com"
""",
            encoding="utf-8",
        )

    compiler = InstructionCompiler(spec_path=example_spec, doc_root=Path("."))
    final_prompt = compiler.compile()
    print(final_prompt)
    print(f"\n[TOKENS ESTIMADOS]: {estimate_tokens(final_prompt)}")
```

---

## 5. Como Usar o Modelo em Produção

1. **Crie o `spec.yaml`** com a missão, stack, fontes e pipeline.
2. **Execute o compilador** para gerar o prompt final:
   ```bash
   python instruction_compiler.py > prompt_final.txt
   ```
3. **Alimente o agente IA** (Copilot, extensão MCP, LangChain, etc.) com o `prompt_final.txt`.
4. **Monitore os tokens** — o compilador já inclui estimativa e truncamento automático.
5. **Itere** — ajuste `max_tokens`, `chunk` e `selector` conforme a complexidade da tarefa.

---

## 6. Extensões e MCPs Recomendados para VS Code

| Tipo | Nome | Propósito |
|------|------|-----------|
| Extensão | `ms-python.python` | Python, linting, debugging |
| Extensão | `ms-vscode-remote.remote-containers` | Dev Containers |
| Extensão | `GitHub.copilot` | Autocomplete e chat |
| Extensão | `ms-azuretools.vscode-docker` | Docker |
| MCP Server | `filesystem` | Acesso a arquivos locais |
| MCP Server | `github` | Issues, PRs, repositórios |
| MCP Server | `postgres` | Consultas a banco |
| MCP Server | `playwright` | Automação web |
| MCP Server | `fetch` | Busca de URLs |

---

## 7. Conclusão

Este modelo fornece uma **base sénior e token‑eficiente** para criar sistemas complexos no VS Code com IA Agents, automação, full‑stack, ML, visão computacional, robótica e até quantum learning. O código Python incluído implementa um compilador de instruções que:

- Resolve fontes e documentação automaticamente.
- Seleciona apenas os chunks mais relevantes.
- Ordena o pipeline com grafo de dependências.
- Respeita rigorosamente o orçamento de tokens.
- Utiliza cache e chunking para evitar desperdício.

Use‑o como alicerce para construir seus próprios agentes autónomos dentro do VS Code.