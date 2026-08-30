# 🤖 Ultimate General AI & Agent Engineering Cheatsheet

A developer-friendly guide organized by **what you want to build**. For every AI task, you get the **terminal install command**, the **import statement**, and a **copy-paste working snippet**.

---

## 📑 Quick Navigation (Pick Your Use Case)
1. [🔌 Connect to Any LLM Provider](#1--connect-to-any-llm-provider)
2. [📐 Get Structured JSON / Schema Outputs (Pydantic)](#2--get-structured-json--schema-outputs)
3. [📚 RAG: Text Chunking, Embeddings & Vector DBs](#3--rag-text-chunking-embeddings--vector-dbs)
4. [📄 Loading Documents (PDFs, Webpages, Text)](#4--loading-documents-pdfs-webpages-text)
5. [🌐 Web Search & Agent Tools](#5--web-search--agent-tools)
6. [🧠 Memory & Conversation History](#6--memory--conversation-history)
7. [🕸️ Building AI Agent Workflows (LangGraph)](#7--building-ai-agent-workflows-langgraph)
8. [📊 Observability, Tracing & Environment](#8--observability-tracing--environment)

---

## 1. 🔌 Connect to Any LLM Provider

### A. Groq (Free & Ultra Fast)
* **Install**: `uv add langchain-groq python-dotenv`
```python
from dotenv import load_dotenv
load_dotenv()

from langchain_groq import ChatGroq

llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0)
response = llm.invoke("Hello, what is your name?")
print(response.content)
```

### B. OpenAI (GPT-4o, GPT-4o-mini)
* **Install**: `uv add langchain-openai python-dotenv`
```python
from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
response = llm.invoke("Summarize quantum computing in 1 sentence.")
print(response.content)
```

### C. Anthropic Claude (Claude 3.5 Sonnet)
* **Install**: `uv add langchain-anthropic python-dotenv`
```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022", temperature=0)
```

### D. Local LLMs (Ollama - 100% Offline & Free)
* **Install**: `uv add langchain-ollama`
```python
from langchain_ollama import ChatOllama

llm = ChatOllama(model="llama3.1", temperature=0)
```

---

## 2. 📐 Get Structured JSON & Schema Outputs

Stop parsing raw strings! Force the LLM to return strict typed Python objects using **Pydantic**.

* **Install**: `uv add pydantic`
```python
from pydantic import BaseModel, Field

# 1. Define the exact shape of data you want
class UserProfile(BaseModel):
    name: str = Field(description="The person's full name")
    age: int = Field(description="Age in years")
    skills: list[str] = Field(description="List of technical skills")

# 2. Tell the LLM to follow this schema
structured_llm = llm.with_structured_output(UserProfile)

# 3. Invoke: You get a clean Python object back!
user = structured_llm.invoke("Hi, I am Sarah, a 28 year old engineer skilled in Python and Docker.")
print(user.name)    # "Sarah"
print(user.skills)  # ['Python', 'Docker']
```

---

## 3. 📚 RAG: Text Chunking, Embeddings & Vector DBs

### A. Split Long Documents into Chunks
* **Install**: `uv add langchain-text-splitters`
```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,        # Max characters per chunk
    chunk_overlap=50       # Overlap to preserve context between chunks
)
chunks = splitter.split_text("Your very long 100-page text here...")
```

### B. Vector Database with Embeddings (ChromaDB)
* **Install**: `uv add chromadb langchain-community langchain-openai`
```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# 1. Create vector store from chunks
vector_store = Chroma.from_texts(
    texts=["LangGraph is for agents", "Python is a programming language"],
    embedding=OpenAIEmbeddings(),
    collection_name="my_knowledge_base"
)

# 2. Search for the most relevant chunk
docs = vector_store.similarity_search("How do I build agents?", k=1)
print(docs[0].page_content)
```

---

## 4. 📄 Loading Documents (PDFs, Webpages, Text)

* **Install**: `uv add pypdf beautifulsoup4 langchain-community`
```python
# 1. Load a PDF File
from langchain_community.document_loaders import PyPDFLoader
pdf_loader = PyPDFLoader("sample.pdf")
pdf_pages = pdf_loader.load()

# 2. Scrape and Load a Webpage URL
from langchain_community.document_loaders import WebBaseLoader
web_loader = WebBaseLoader("https://en.wikipedia.org/wiki/Artificial_intelligence")
web_docs = web_loader.load()
```

---

## 5. 🌐 Web Search & Agent Tools

Give your LLMs real-time access to the internet and tools!

### A. DuckDuckGo (Free Web Search - No API Key required)
* **Install**: `uv add duckduckgo-search langchain-community`
```python
from langchain_community.tools import DuckDuckGoSearchRun

search_tool = DuckDuckGoSearchRun()
results = search_tool.invoke("Current stock price of NVIDIA")
print(results)
```

### B. Tavily Search (Optimized for AI Agents)
* **Install**: `uv add langchain-tavily`
```python
from langchain_tavily import TavilySearch

tavily = TavilySearch(max_results=3)
results = tavily.invoke({"query": "What happened in AI news today?"})
```

### C. Turn Any Custom Python Function into an LLM Tool
```python
from langchain_core.tools import tool

@tool
def calculate_tax(salary: float, tax_rate: float = 0.20) -> float:
    """Calculates the total income tax for a given salary."""
    return salary * tax_rate

# Pass it to your LLM:
llm_with_tools = llm.bind_tools([calculate_tax])
```

---

## 6. 🧠 Memory & Conversation History

Keep track of user conversations over multiple turns.

```python
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# Message History List
conversation = [
    SystemMessage(content="You are a helpful customer support agent."),
    HumanMessage(content="My order ID is #4592."),
    AIMessage(content="Got it! How can I help you with order #4592?"),
    HumanMessage(content="Can you track its status?")
]

response = llm.invoke(conversation)
print(response.content)
```

---

## 7. 🕸️ Building AI Agent Workflows (LangGraph)

When you need an autonomous agent that thinks, calls tools, and loops until the job is done.

* **Install**: `uv add langgraph`
```python
from langgraph.graph import StateGraph, START, MessagesState
from langgraph.prebuilt import ToolNode, tools_condition

# 1. Register tools
tools = [calculate_tax]
llm_with_tools = llm.bind_tools(tools)

# 2. Define the LLM worker node
def agent_node(state: MessagesState):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

# 3. Assemble the State Machine
builder = StateGraph(MessagesState)
builder.add_node("agent", agent_node)
builder.add_node("tools", ToolNode(tools))

builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", tools_condition) # Loops to tools if tool called
builder.add_edge("tools", "agent")                      # Sends tool answer back to agent

graph = builder.compile()

# 4. Run the Agent:
result = graph.invoke({"messages": [HumanMessage(content="Calculate tax for salary 100000")]})
```

---

## 8. 📊 Observability, Tracing & Environment

### Auto-trace all LLM calls in LangSmith (Debug errors & latency)
```env
# In your .env file:
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY="lsv2_pt_..."
LANGCHAIN_PROJECT="my-ai-project"
```

---

## 💡 Quick Cheat Formula: Which package do I need?

| If you want to... | Use this package |
| :--- | :--- |
| Call Groq for free | `langchain-groq` |
| Call OpenAI | `langchain-openai` |
| Call Claude | `langchain-anthropic` |
| Parse output as JSON | `pydantic` |
| Chunk large texts | `langchain-text-splitters` |
| Store vectors locally | `chromadb` |
| Search web without API key | `duckduckgo-search` |
| Search web with AI summary | `langchain-tavily` |
| Build multi-step agents | `langgraph` |
| Read `.env` files | `python-dotenv` |
