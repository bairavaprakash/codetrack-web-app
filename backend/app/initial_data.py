import asyncio
import json
import os
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, init_db
from app.core.security import get_password_hash
from app.models.roadmap import Roadmap
from app.models.task import Task
from app.models.user import User

# All 12 comprehensive programming languages & tech stack roadmaps
ROADMAPS_SEED = [
    {
        "slug": "python",
        "title": "Python Roadmap",
        "language": "Python",
        "description": "General-purpose, high-level language popular in data science, AI, and backend.",
        "icon": "logo-python",
        "color": "#38BDF8",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "py-1",
                "title": "Variables, Types & Operators",
                "stage": "Beginner",
                "description": "Understand integers, floats, strings, booleans, and arithmetic/logical operators.",
                "objectives": ["Master basic data types and variable assignment", "Understand type conversion", "Use f-strings for formatting"],
                "codeExample": "name: str = 'Developer'\nscore: float = 95.5\nprint(f'{name} scored {score}%')",
                "practiceTasks": ["Write a temperature converter", "Create a tip calculator", "Implement string reverser"],
                "resources": [{"title": "Python Official Tutorial", "url": "https://docs.python.org/3/tutorial/"}]
            },
            {
                "id": "py-2",
                "title": "Control Flow & Loops",
                "stage": "Beginner",
                "description": "Conditional statements (if/elif/else), while loops, and for loops with range.",
                "objectives": ["Write branching logic with conditionals", "Iterate over ranges and collections", "Use break, continue, and pass properly"],
                "codeExample": "for i in range(1, 16):\n    if i % 15 == 0: print('FizzBuzz')\n    elif i % 3 == 0: print('Fizz')\n    elif i % 5 == 0: print('Buzz')",
                "practiceTasks": ["FizzBuzz implementation", "Prime number checker", "Collatz sequence generator"],
                "resources": [{"title": "Control Flow Docs", "url": "https://docs.python.org/3/tutorial/controlflow.html"}]
            },
            {
                "id": "py-3",
                "title": "Data Structures: Lists, Tuples, Dicts, Sets",
                "stage": "Beginner",
                "description": "Core container types, list comprehensions, and dictionary methods.",
                "objectives": ["Perform CRUD operations on lists and dicts", "Understand tuple immutability and set uniqueness", "Write list/dict comprehensions"],
                "codeExample": "squares = [x**2 for x in range(10) if x % 2 == 0]\nlookup = {f'key_{i}': i for i in range(3)}",
                "practiceTasks": ["Remove duplicates using set", "Word frequency counter", "Sort dictionary by values"],
                "resources": [{"title": "Data Structures in Python", "url": "https://docs.python.org/3/tutorial/datastructures.html"}]
            },
            {
                "id": "py-4",
                "title": "Functions, Scopes & Lambdas",
                "stage": "Intermediate",
                "description": "Defining functions, *args/**kwargs, default parameters, and lambda expressions.",
                "objectives": ["Understand local vs global scopes", "Handle arbitrary arguments", "Use map, filter, and lambda"],
                "codeExample": "def greet(name: str, *tags: str, **opts: Any) -> str:\n    return f'{name} [{opts}]'",
                "practiceTasks": ["Custom map function", "Recursive factorial and fibonacci", "Kwargs validator"],
                "resources": [{"title": "Defining Functions", "url": "https://docs.python.org/3/tutorial/controlflow.html#defining-functions"}]
            },
            {
                "id": "py-5",
                "title": "Object-Oriented Programming (OOP)",
                "stage": "Intermediate",
                "description": "Classes, instances, inheritance, polymorphism, encapsulation, and magic methods.",
                "objectives": ["Design classes with __init__ and methods", "Implement inheritance and method overriding", "Use __str__ and __repr__"],
                "codeExample": "class Task:\n    def __init__(self, title: str):\n        self.title = title\n        self.completed = False",
                "practiceTasks": ["BankAccount with limits", "Shape hierarchy (Circle, Rectangle)", "Custom iterator class"],
                "resources": [{"title": "Classes in Python", "url": "https://docs.python.org/3/tutorial/classes.html"}]
            },
            {
                "id": "py-6",
                "title": "Decorators & Generators",
                "stage": "Advanced",
                "description": "Higher-order functions, function decorators with arguments, and memory-efficient generators.",
                "objectives": ["Build timer and logging decorators", "Understand yield and generator expressions", "Optimize memory usage"],
                "codeExample": "import functools, time\ndef timer(func):\n    @functools.wraps(func)\n    def wrapper(*args, **kwargs):\n        t0 = time.perf_counter()\n        res = func(*args, **kwargs)\n        print(f'{func.__name__} took {time.perf_counter() - t0:.4f}s')\n        return res\n    return wrapper",
                "practiceTasks": ["@retry decorator with backoff", "Prime number generator", "Authentication decorator"],
                "resources": [{"title": "Generators Wiki", "url": "https://wiki.python.org/moin/Generators"}]
            },
            {
                "id": "py-7",
                "title": "AsyncIO & Concurrency",
                "stage": "Advanced",
                "description": "Event loops, coroutines, async/await, TaskGroups, and non-blocking I/O.",
                "objectives": ["Write concurrent code with asyncio.gather", "Understand async context managers", "Handle timeouts and cancellations"],
                "codeExample": "import asyncio\nasync def fetch_item(item_id: int):\n    await asyncio.sleep(0.1)\n    return f'Item {item_id}'\nasync def main():\n    res = await asyncio.gather(*(fetch_item(i) for i in range(5)))",
                "practiceTasks": ["Concurrent URL status checker", "Async rate limiter", "Async producer-consumer queue"],
                "resources": [{"title": "AsyncIO Documentation", "url": "https://docs.python.org/3/library/asyncio.html"}]
            }
        ]
    },
    {
        "slug": "javascript",
        "title": "JavaScript Roadmap",
        "language": "JavaScript",
        "description": "The language of the web, powering interactive browser frontends and NodeJS backends.",
        "icon": "logo-javascript",
        "color": "#FBBF24",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "js-1",
                "title": "Variables, Types & Operators",
                "stage": "Beginner",
                "description": "let vs const vs var, primitives, equality (== vs ===), and template literals.",
                "objectives": ["Understand block scope with let and const", "Master strict equality and coercion", "Use template literals and ternary operator"],
                "codeExample": "const user = 'Alex';\nconst status = user ? `Welcome, ${user}!` : 'Guest';",
                "practiceTasks": ["Primitive type detector", "Type coercion quiz solver", "String formatting helpers"],
                "resources": [{"title": "MDN JavaScript Basics", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript"}]
            },
            {
                "id": "js-2",
                "title": "Functions, Scope & Closures",
                "stage": "Intermediate",
                "description": "Arrow functions, hoisting, lexical environment, closures, and IIFE.",
                "objectives": ["Understand lexical scope and closure memory", "Use arrow functions vs function declarations", "Build private state using closures"],
                "codeExample": "function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}",
                "practiceTasks": ["Counter factory with reset", "Memoize function helper", "Currying implementation"],
                "resources": [{"title": "MDN Closures", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures"}]
            },
            {
                "id": "js-3",
                "title": "Promises & Async/Await",
                "stage": "Advanced",
                "description": "Event Loop, microtask queue, Promise.all, Promise.allSettled, and error handling with try/catch.",
                "objectives": ["Understand the JavaScript event loop and macrotasks/microtasks", "Chain promises cleanly", "Handle parallel promises"],
                "codeExample": "async function loadData() {\n  try {\n    const res = await fetch('/api/tasks');\n    const data = await res.json();\n    return data;\n  } catch (err) {\n    console.error(err);\n  }\n}",
                "practiceTasks": ["Retry with exponential backoff", "Custom Promise.all implementation", "Debounce and throttle utilities"],
                "resources": [{"title": "JavaScript Event Loop", "url": "https://javascript.info/event-loop"}]
            }
        ]
    },
    {
        "slug": "typescript",
        "title": "TypeScript Roadmap",
        "language": "TypeScript",
        "description": "Typed superset of JavaScript adding compile-time safety, interfaces, and generics.",
        "icon": "code-slash",
        "color": "#60A5FA",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "ts-1",
                "title": "Basic Types, Unions & Type Aliases",
                "stage": "Beginner",
                "description": "Type annotations, union types, type inference, and custom type definitions.",
                "objectives": ["Annotate primitives and arrays", "Create union types for multi-format values", "Define type aliases with type keyword"],
                "codeExample": "type Priority = 'low' | 'medium' | 'high';\ninterface TaskItem { id: string; title: string; priority: Priority; }",
                "practiceTasks": ["Type an API response payload", "Create literal union for task states", "Write a type guard function"],
                "resources": [{"title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/handbook/"}]
            },
            {
                "id": "ts-2",
                "title": "Generics & Utility Types",
                "stage": "Intermediate",
                "description": "Generic functions, generic constraints, Partial, Pick, Omit, Record, and ReturnType.",
                "objectives": ["Build reusable generic functions", "Constrain generics with extends", "Master built-in utility types"],
                "codeExample": "function wrapResponse<T>(data: T, status: number): { data: T; status: number } {\n  return { data, status };\n}",
                "practiceTasks": ["Generic repository pattern", "Transform types with Partial & Pick", "DeepReadonly utility type"],
                "resources": [{"title": "Generics Handbook", "url": "https://www.typescriptlang.org/docs/handbook/2/generics.html"}]
            },
            {
                "id": "ts-3",
                "title": "Conditional Types & Type Narrowing",
                "stage": "Advanced",
                "description": "infer keyword, discriminated unions, template literal types, and exhaustive switch checks.",
                "objectives": ["Use discriminated unions with exhaustiveness checking", "Write conditional types (T extends U ? X : Y)", "Extract types using infer"],
                "codeExample": "type Action = { type: 'ADD'; payload: string } | { type: 'REMOVE'; id: number };\nfunction handle(a: Action) {\n  switch (a.type) {\n    case 'ADD': return a.payload;\n    case 'REMOVE': return a.id;\n  }\n}",
                "practiceTasks": ["Pattern matching with discriminated unions", "Flatten array type using infer", "Event emitter with strongly typed events"],
                "resources": [{"title": "Advanced Types", "url": "https://www.typescriptlang.org/docs/handbook/2/types-from-types.html"}]
            }
        ]
    },
    {
        "slug": "fastapi",
        "title": "FastAPI Roadmap",
        "language": "FastAPI",
        "description": "Modern, high-performance Python web framework for building REST & GraphQL APIs.",
        "icon": "flash",
        "color": "#10B981",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "fa-1",
                "title": "Path Operations, Query Params & Body",
                "stage": "Beginner",
                "description": "Routes, path parameters with validation, query strings, and Pydantic request bodies.",
                "objectives": ["Create GET, POST, PUT, DELETE routes", "Validate query params using Query()", "Parse request JSON with Pydantic BaseModel"],
                "codeExample": "from fastapi import FastAPI, Query\napp = FastAPI()\n@app.get('/items/{item_id}')\ndef get_item(item_id: int, q: str | None = Query(None)): return {'item_id': item_id, 'q': q}",
                "practiceTasks": ["CRUD API for bookmarks", "Pagination query parameters", "Validation error customization"],
                "resources": [{"title": "FastAPI Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/"}]
            },
            {
                "id": "fa-2",
                "title": "Dependency Injection & Security",
                "stage": "Intermediate",
                "description": "Depends, sub-dependencies, OAuth2, JWT token verification, and database session injection.",
                "objectives": ["Write reusable dependencies with Depends", "Authenticate requests using Bearer JWT tokens", "Manage database transaction lifecycles"],
                "codeExample": "from fastapi import Depends\nasync def get_user(token: str = Depends(oauth2_scheme)):\n    return verify_jwt(token)",
                "practiceTasks": ["User authentication middleware", "Permission role dependency", "Database session context dependency"],
                "resources": [{"title": "FastAPI Dependencies", "url": "https://fastapi.tiangolo.com/tutorial/dependencies/"}]
            },
            {
                "id": "fa-3",
                "title": "SQLAlchemy 2.0 Async & Alembic Migrations",
                "stage": "Advanced",
                "description": "Async sessions, DeclarativeBase, relationships, Alembic schema migrations, and testing.",
                "objectives": ["Configure create_async_engine and async_sessionmaker", "Write async queries with select and joins", "Run database migrations via Alembic"],
                "codeExample": "async with async_session() as session:\n    res = await session.execute(select(Task).where(Task.user_id == uid))\n    tasks = res.scalars().all()",
                "practiceTasks": ["Multi-table relation schema with cascade deletes", "Alembic revision autogeneration", "Pytest async test fixture"],
                "resources": [{"title": "SQLAlchemy Async", "url": "https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html"}]
            }
        ]
    },
    {
        "slug": "react-native",
        "title": "React Native & Expo Roadmap",
        "language": "React Native",
        "description": "Build native iOS and Android apps using React, Expo Router, and mobile device APIs.",
        "icon": "phone-portrait",
        "color": "#A855F7",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "rn-1",
                "title": "Core Components & Flexbox Layout",
                "stage": "Beginner",
                "description": "View, Text, ScrollView, FlatList, TouchableOpacity, and Flexbox styling.",
                "objectives": ["Build responsive mobile screens", "Use FlatList for virtualized lists", "Implement touchable button interactions"],
                "codeExample": "<View style={{ flex: 1, padding: 16 }}>\n  <Text style={{ fontSize: 20, fontWeight: '700' }}>Tasks</Text>\n</View>",
                "practiceTasks": ["Task list card layout", "Bottom sheet modal screen", "Horizontal chip selector"],
                "resources": [{"title": "React Native Docs", "url": "https://reactnative.dev/docs/getting-started"}]
            },
            {
                "id": "rn-2",
                "title": "Expo Router & Navigation",
                "stage": "Intermediate",
                "description": "File-based routing, tabs, stack navigators, params, and safe area insets.",
                "objectives": ["Configure Expo Router folder structure", "Build bottom tab navigation bar", "Pass parameters across stack screens"],
                "codeExample": "import { Tabs } from 'expo-router';\nexport default function Layout() { return <Tabs />; }",
                "practiceTasks": ["Five-tab bottom navigation", "Dynamic route /task/[id]", "Custom header with modal transition"],
                "resources": [{"title": "Expo Router Docs", "url": "https://docs.expo.dev/router/introduction/"}]
            },
            {
                "id": "rn-3",
                "title": "Offline Storage, SecureStore & Notifications",
                "stage": "Advanced",
                "description": "AsyncStorage local persistence, SecureStore for JWT tokens, and Expo Notifications.",
                "objectives": ["Persist state offline with AsyncStorage", "Save sensitive auth tokens in SecureStore", "Schedule local reminder notifications"],
                "codeExample": "import * as SecureStore from 'expo-secure-store';\nawait SecureStore.setItemAsync('token', jwtToken);",
                "practiceTasks": ["Offline cache synchronizer", "Scheduled daily study reminder notification", "Secure biometric/token storage wrapper"],
                "resources": [{"title": "Expo SecureStore", "url": "https://docs.expo.dev/versions/latest/sdk/securestore/"}]
            }
        ]
    },
    {
        "slug": "react",
        "title": "React Roadmap",
        "language": "React",
        "description": "Declarative component-driven user interfaces with modern React 19 hooks and compiler.",
        "icon": "logo-react",
        "color": "#38BDF8",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "rc-1",
                "title": "Components, Props & State",
                "stage": "Beginner",
                "description": "Functional components, JSX syntax, props, and useState hook.",
                "objectives": ["Create reusable functional components", "Pass data and callbacks via props", "Manage local component state"],
                "codeExample": "function TaskCard({ title, done }: { title: string; done: boolean }) {\n  return <div>{title} - {done ? 'Done' : 'Pending'}</div>;\n}",
                "practiceTasks": ["Interactive counter component", "Filterable item list", "Form input with live character counter"],
                "resources": [{"title": "React Docs", "url": "https://react.dev"}]
            },
            {
                "id": "rc-2",
                "title": "Hooks & Side Effects",
                "stage": "Intermediate",
                "description": "useEffect, useMemo, useCallback, useRef, and custom hooks.",
                "objectives": ["Execute side effects on mount and updates", "Optimize performance with useMemo", "Create reusable custom hooks"],
                "codeExample": "function useLocalStorage<T>(key: string, init: T) {\n  const [val, setVal] = useState<T>(init);\n  return [val, setVal] as const;\n}",
                "practiceTasks": ["useDebounce custom hook", "useInterval countdown timer hook", "useWindowSize hook"],
                "resources": [{"title": "React Hooks", "url": "https://react.dev/reference/react"}]
            }
        ]
    },
    {
        "slug": "sql",
        "title": "SQL & PostgreSQL Roadmap",
        "language": "SQL",
        "description": "Relational databases, indexing, joins, transactions, and performance query tuning.",
        "icon": "server",
        "color": "#3B82F6",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "sql-1",
                "title": "DDL, DML & Basic Queries",
                "stage": "Beginner",
                "description": "CREATE TABLE, SELECT, INSERT, UPDATE, DELETE, and WHERE filtering.",
                "objectives": ["Design normalized table schemas", "Filter rows with AND/OR/IN/LIKE", "Sort and paginate with ORDER BY and LIMIT"],
                "codeExample": "SELECT id, title, priority FROM tasks WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10;",
                "practiceTasks": ["Design e-commerce schema", "Filter active tasks with due date", "Insert batch records"],
                "resources": [{"title": "PostgreSQL Tutorial", "url": "https://www.postgresqltutorial.com/"}]
            },
            {
                "id": "sql-2",
                "title": "Joins, Aggregations & Indexes",
                "stage": "Intermediate",
                "description": "INNER/LEFT/RIGHT JOINs, GROUP BY, HAVING, and B-Tree indexing.",
                "objectives": ["Join multi-table relationships", "Compute aggregates with COUNT, SUM, AVG", "Accelerate queries using index keys"],
                "codeExample": "SELECT u.username, COUNT(t.id) as task_count\nFROM users u\nLEFT JOIN tasks t ON u.id = t.user_id\nGROUP BY u.username;",
                "practiceTasks": ["Leaderboard query with joins", "Monthly focus minutes aggregation", "Explain analyze query plan inspection"],
                "resources": [{"title": "PostgreSQL Indexes", "url": "https://www.postgresql.org/docs/current/indexes.html"}]
            }
        ]
    },
    {
        "slug": "dsa",
        "title": "Data Structures & Algorithms",
        "language": "DSA",
        "description": "Arrays, linked lists, trees, graphs, sorting, dynamic programming, and complexity analysis.",
        "icon": "git-network",
        "color": "#EC4899",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "dsa-1",
                "title": "Big-O Notation & Arrays / Two Pointers",
                "stage": "Beginner",
                "description": "Time and space complexity, array manipulation, and two-pointer technique.",
                "objectives": ["Calculate Big-O asymptotic complexity", "Solve Two Sum in O(N) time", "Use two pointers on sorted arrays"],
                "codeExample": "def two_sum(arr: list[int], target: int) -> list[int]:\n  seen = {}\n  for i, n in enumerate(arr):\n    diff = target - n\n    if diff in seen: return [seen[diff], i]\n    seen[n] = i\n  return []",
                "practiceTasks": ["Two Sum II - Sorted array", "Container With Most Water", "Trapping Rain Water"],
                "resources": [{"title": "NeetCode Roadmap", "url": "https://neetcode.io/roadmap"}]
            },
            {
                "id": "dsa-2",
                "title": "Trees, Graphs & BFS/DFS",
                "stage": "Intermediate",
                "description": "Binary trees, BST traversal, graph adjacency lists, breadth-first and depth-first search.",
                "objectives": ["Traverse trees (preorder, inorder, postorder)", "Implement BFS using Queue", "Detect cycles in graphs with DFS"],
                "codeExample": "from collections import deque\ndef bfs(start, graph):\n  visited = {start}\n  q = deque([start])\n  while q:\n    curr = q.popleft()\n    for n in graph.get(curr, []):\n      if n not in visited: visited.add(n); q.append(n)",
                "practiceTasks": ["Number of Islands", "Clone Graph", "Course Schedule topological sort"],
                "resources": [{"title": "Tree & Graph Algorithms", "url": "https://visualgo.net/en"}]
            }
        ]
    },
    {
        "slug": "java",
        "title": "Java Roadmap",
        "language": "Java",
        "description": "Object-oriented, statically typed language used heavily in enterprise backend systems and Android.",
        "icon": "cafe",
        "color": "#F97316",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "java-1",
                "title": "OOP, Interfaces & Collections",
                "stage": "Beginner",
                "description": "Encapsulation, inheritance, polymorphism, ArrayList, HashMap, and HashSet.",
                "objectives": ["Create classes and interfaces", "Master the Java Collections Framework", "Handle exceptions with try-catch-finally"],
                "codeExample": "public class Task {\n    private String title;\n    public Task(String title) { this.title = title; }\n    public String getTitle() { return title; }\n}",
                "practiceTasks": ["Inventory system with HashMap", "Custom exception hierarchy", "Comparable interface implementation"],
                "resources": [{"title": "Oracle Java Tutorials", "url": "https://docs.oracle.com/javase/tutorial/"}]
            }
        ]
    },
    {
        "slug": "c",
        "title": "C Language Roadmap",
        "language": "C",
        "description": "Low-level procedural language powering operating systems, kernels, and embedded devices.",
        "icon": "hardware-chip",
        "color": "#64748B",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "c-1",
                "title": "Pointers, Memory Allocation & Structs",
                "stage": "Beginner",
                "description": "Pointers, memory addresses, malloc, free, structs, and header files.",
                "objectives": ["Understand memory addresses and pointer arithmetic", "Allocate heap memory with malloc/free", "Define structs and typedef"],
                "codeExample": "#include <stdio.h>\n#include <stdlib.h>\nint main() {\n    int *ptr = malloc(sizeof(int) * 5);\n    ptr[0] = 42;\n    free(ptr);\n    return 0;\n}",
                "practiceTasks": ["Dynamic array implementation", "Singly linked list in C", "String length without strlen"],
                "resources": [{"title": "C Programming Language", "url": "https://en.cppreference.com/w/c"}]
            }
        ]
    },
    {
        "slug": "cpp",
        "title": "C++ Roadmap",
        "language": "C++",
        "description": "High-performance systems programming with templates, RAII, and the Standard Template Library (STL).",
        "icon": "layers",
        "color": "#3B82F6",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "cpp-1",
                "title": "STL, References & RAII",
                "stage": "Beginner",
                "description": "std::vector, std::unordered_map, references, smart pointers (std::unique_ptr), and modern C++20 features.",
                "objectives": ["Use std::vector and algorithms", "Understand RAII memory management", "Avoid raw pointers with unique_ptr"],
                "codeExample": "#include <iostream>\n#include <vector>\n#include <memory>\nint main() {\n    auto task = std::make_unique<std::string>('Learn C++');\n    std::cout << *task << std::endl;\n}",
                "practiceTasks": ["Custom vector wrapper with RAII", "Word frequency using unordered_map", "Smart pointer ownership demo"],
                "resources": [{"title": "cppreference", "url": "https://en.cppreference.com/w/"}]
            }
        ]
    },
    {
        "slug": "html-css",
        "title": "HTML5 & CSS3 Roadmap",
        "language": "HTML / CSS",
        "description": "Semantic markup, responsive layout design, CSS Grid, Flexbox, and CSS animations.",
        "icon": "browsers",
        "color": "#EF4444",
        "level": "Beginner to Advanced",
        "topics": [
            {
                "id": "hc-1",
                "title": "Semantic HTML, Flexbox & CSS Grid",
                "stage": "Beginner",
                "description": "Semantic tags (header, nav, main, article), Flexbox alignments, and CSS Grid templates.",
                "objectives": ["Write accessible semantic HTML markup", "Build responsive flexbox layouts", "Create two-dimensional layouts with CSS Grid"],
                "codeExample": ".container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n  gap: 1.5rem;\n}",
                "practiceTasks": ["Responsive navbar with hamburger toggle", "Pricing cards grid", "CSS glassmorphism card animation"],
                "resources": [{"title": "MDN Web Docs", "url": "https://developer.mozilla.org/en-US/docs/Web/HTML"}]
            }
        ]
    }
]


async def seed_roadmaps_data(session: AsyncSession) -> None:
    """Seed roadmap catalog into provided session."""
    for r_data in ROADMAPS_SEED:
        existing = await session.execute(
            select(Roadmap).where(Roadmap.slug == r_data["slug"])
        )
        if not existing.scalar_one_or_none():
            roadmap = Roadmap(
                slug=r_data["slug"],
                title=r_data["title"],
                language=r_data["language"],
                description=r_data["description"],
                icon=r_data.get("icon", "code"),
                color=r_data.get("color", "#38bdf8"),
                level=r_data.get("level", "Beginner to Advanced"),
                total_topics=len(r_data.get("topics", [])),
                topics=r_data.get("topics", []),
            )
            session.add(roadmap)


async def seed_initial_data(session: Optional[AsyncSession] = None) -> None:
    """Initialize database tables and seed initial roadmaps and demo user."""
    await init_db()

    if session is not None:
        await _seed_with_session(session)
    else:
        async with AsyncSessionLocal() as sess:
            await _seed_with_session(sess)


async def _seed_with_session(session: AsyncSession) -> None:
    await seed_roadmaps_data(session)

    # Check / Seed demo user
    demo_user_res = await session.execute(
        select(User).where(User.email == "demo@codetrack.dev")
    )
    demo_user = demo_user_res.scalar_one_or_none()
    if not demo_user:
        demo_user = User(
            email="demo@codetrack.dev",
            username="codetrack",
            hashed_password=get_password_hash("Password123!"),
            full_name="CodeTrack Developer",
            avatar_url=None,
            streak=5,
            total_focus_minutes=150,
            is_active=True,
        )
        session.add(demo_user)
        await session.flush()

        # Seed demo tasks for the demo user
        sample_tasks = [
            Task(
                user_id=demo_user.id,
                title="Implement Binary Search & 2 Pointers in Python",
                description="Solve 3 LeetCode problems covering two pointers and binary search on sorted arrays.",
                category="coding",
                priority="high",
                status="completed",
                due_date="2026-10-13",
                due_time="12:00",
                is_checklist_item=False,
                estimated_minutes=45,
                actual_minutes=45,
                subtasks=[
                    {"id": "st-1", "title": "Two Sum II - Sorted array", "completed": True},
                    {"id": "st-2", "title": "Binary Search iterative implementation", "completed": True},
                    {"id": "st-3", "title": "Search in Rotated Sorted Array", "completed": True},
                ],
            ),
            Task(
                user_id=demo_user.id,
                title="Study TypeScript Discriminated Unions",
                description="Go through TypeScript roadmap module on pattern matching, narrowing, and exhaustive checking.",
                category="learning",
                priority="urgent",
                status="pending",
                due_date="2026-10-13",
                due_time="15:30",
                is_checklist_item=False,
                estimated_minutes=30,
                actual_minutes=0,
                subtasks=[
                    {"id": "st-4", "title": "Read TS handbook chapter on narrowing", "completed": True},
                    {"id": "st-5", "title": "Write pattern matching example in app", "completed": False},
                ],
            ),
            Task(
                user_id=demo_user.id,
                title="Refactor FastAPI Async Session Management",
                description="Optimize connection pool and review dependency injection in backend endpoints.",
                category="project",
                priority="medium",
                status="pending",
                due_date="2026-10-14",
                due_time="17:00",
                is_checklist_item=False,
                estimated_minutes=60,
                actual_minutes=0,
                subtasks=[
                    {"id": "st-6", "title": "Review session generator in dependencies.py", "completed": False},
                    {"id": "st-7", "title": "Add test case for transaction rollback", "completed": False},
                ],
            ),
        ]
        session.add_all(sample_tasks)

    await session.commit()
    print("Database initialized and seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed_initial_data())
