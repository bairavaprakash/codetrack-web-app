# CodeTrack – Daily Coding Task Planner & Reminder App

**CodeTrack** is a cross-platform mobile application built with **React Native**, **Expo Router**, and **TypeScript**. It is designed to help developers plan daily programming tasks, follow comprehensive curriculums across 12 programming languages, set push notification reminders, track Pomodoro study sessions, and visualize verified productivity metrics.

---

## 🚀 Key Features

### 1. 📊 Home Dashboard
- **Dynamic Greeting & Header**: Shows personalized greeting, real-time date, current learning streak (`🔥 X Days`), and quick settings modal trigger.
- **Key Metrics Grid**: Live counts for Today's Total Tasks, Completed, Pending, and Study Minutes.
- **Daily Goal Completion Progress**: Dynamic progress bar with instant celebration banner upon clearing 100% of today's tasks.
- **Pomodoro Quick Launcher**: One-tap access to focus sessions.
- **Today's Daily Checklist**: Quick check off today's habits with instant persistence.
- **Continue Learning Section**: Direct progress overview for active language roadmaps with the next recommended topic.
- **Upcoming Deadlines**: High-priority tasks and upcoming reminders.

### 2. 📝 Daily Task Management
- **Task Creation & Editing**: Title, description, category (`Learning`, `Coding Practice`, `Project`, `Revision`, `Personal`), priority (`Low`, `Medium`, `High`, `Urgent`), language tag, date, start time, and deadline.
- **Subtasks & Checklist**: Add step-by-step checklist items to tasks with individual progress tracking.
- **Push Reminders**: Set automated notifications for tasks before their deadlines.
- **Full CRUD & Duplication**: Edit, duplicate, mark completed, and delete tasks with confirmation dialogs.
- **Advanced Filtering & Search**: Real-time search by title, language, or description; filter by status (`All`, `Pending`, `Completed`, `Overdue`), category, or priority; sort by deadline, priority, or date.

### 3. 🗺️ Coding Learning Roadmaps (12 Languages)
Structured curriculums with Beginner, Intermediate, and Advanced tiers for:
1. **Python**
2. **JavaScript**
3. **TypeScript**
4. **Java**
5. **C**
6. **C++**
7. **HTML and CSS**
8. **SQL**
9. **React**
10. **React Native**
11. **FastAPI**
12. **Data Structures and Algorithms (DSA)**

Each topic includes:
- Learning objectives
- Hands-on practice exercises
- Mini-projects
- Revision tasks and interview concepts
- Topic completion toggle with live roadmap progress recalculation

### 4. 🔔 Reminder & Notification System
- Powered by `expo-notifications`.
- Local notification scheduling with time triggers.
- Safe graceful fallback on Web and unpermitted devices.
- Auto-cancels scheduled notifications when a task is deleted or disabled.
- Includes a test notification trigger in Settings.

### 5. ✅ Daily Checklist
- Dedicated view for daily coding goals, algorithmic problem-solving, code commits, and revision.
- Add custom checklist items categorized by type.
- Instant toggle and deletion.

### 6. 📅 Calendar & Weekly Planner
- Interactive horizontal 7-day strip with task indicators (color-coded dots for pending/completed).
- Week navigation arrows and quick "Today" jump.
- Day-specific task breakdown.
- Overdue tasks alert box highlighting missed deadlines.
- "Add Task on this Date" quick creator.
- Weekly study strategy guide.

### 7. ⏱️ Pomodoro Study Timer & Analytics
- **Customizable Pomodoro**: Focus session (default 25m), Short Break (default 5m), Long Break (default 15m).
- **Association**: Tag each focus session with a programming language or task.
- **Auto-Log**: Automatically records completed study time into persistent history.
- **Verified Productivity Analytics**:
  - Daily completion rate
  - Weekly productivity bar chart (Mon–Sun verified completed tasks)
  - Study time breakdown by programming language (minutes and percentages)
  - Roadmap modules completed counter
  - Recent completed tasks timeline with timestamps

### 8. 🎨 UI/UX & Theming
- Sleek modern dark mode (`#090D16`) and clean light mode (`#F8FAFC`).
- 5-tab responsive bottom navigation with `@expo/vector-icons`.
- Smooth progress indicators, category badges, and accessible confirmation dialogs.
- Custom Settings modal for Pomodoro durations, profile name, daily study goal, and notification permissions.

---

## 📂 Project Structure

```text
MyFirstApp/
├── app.json                     # Expo configuration (app name, icon, schemes)
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── src/
│   ├── app/                     # Expo Router file-based screens
│   │   ├── _layout.tsx          # Root layout (AppProvider, Theme, Bottom Tabs)
│   │   ├── index.tsx            # Home Dashboard screen
│   │   ├── tasks.tsx            # Daily Task Management & Checklist screen
│   │   ├── learn.tsx            # Coding Learning Roadmaps screen
│   │   ├── calendar.tsx         # Calendar & Weekly Planner screen
│   │   └── timer.tsx            # Pomodoro Timer & Analytics screen
│   ├── components/              # Reusable UI components
│   │   ├── CategoryBadge.tsx    # Category & priority badges
│   │   ├── ConfirmModal.tsx     # Accessible confirmation dialog
│   │   ├── ProgressBar.tsx      # Smooth progress bar component
│   │   ├── SettingsModal.tsx    # Theme, Pomodoro durations, profile modal
│   │   ├── TaskModal.tsx        # Create / Edit / Duplicate task modal
│   │   └── TopicDetailModal.tsx # Roadmap topic objectives & exercises modal
│   ├── constants/
│   │   ├── colors.ts            # Design system palette (Dark & Light modes)
│   │   └── theme.ts             # Spacing, typography, and layout metrics
│   ├── context/
│   │   └── AppContext.tsx       # Global state management (tasks, roadmaps, timer)
│   ├── data/
│   │   └── roadmapsData.ts      # Complete curriculum for all 12 roadmaps
│   ├── services/
│   │   ├── notifications.ts     # Expo notifications scheduling & permissions
│   │   └── storage.ts           # Persistent storage via AsyncStorage with seeding
│   └── types/
│       └── index.ts             # TypeScript interfaces and data models
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo Go** app on Android/iOS (from Google Play Store or App Store)

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npx expo start
```

Or run with tunnel (recommended if mobile device and computer are on different subnets or using cellular data):
```bash
npx expo start --tunnel
```

---

## 📱 Testing on Android

1. Install **Expo Go** from the Google Play Store on your Android device.
2. Ensure your terminal has launched the server with `npx expo start` (or `npx expo start --tunnel`).
3. Scan the QR code displayed in the terminal using the **Expo Go** camera (or built-in camera).
4. For Android Emulator:
   - Ensure Android Studio is running and an emulator is active.
   - Press `a` in the Expo terminal to automatically install and open the app in the emulator.

---

## 🧪 Verified User Flows & Scenarios
- **Task Management**: Create tasks, set priority, add subtasks, edit, duplicate, and delete with confirmation.
- **Checklist**: Check items on the Dashboard or Tasks tab; check marks update in real-time and persist across restarts.
- **Roadmaps**: Browse 12 languages, filter by level, open module details, mark completed, and watch the progress bar increase.
- **Pomodoro**: Run focus intervals, pause, reset, switch between Focus/Short Break/Long Break, and observe logged study time in Analytics.
- **Calendar**: Tap any day in the horizontal strip to view or add tasks specifically for that date.
- **Dark/Light Mode**: Toggle between Dark and Light mode instantly from the top-right Settings button.

---

## 📝 Known Limitations
- Background audio chimes for timers in Expo Go are limited by mobile OS background constraints; local push notifications are used instead to alert when sessions complete.
- Push notifications in Expo Go require enabling Notification permissions when prompted.
