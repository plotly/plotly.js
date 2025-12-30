# Types Directory

Centralized TypeScript type definitions for plotly.js.

## Quick Import

```typescript
// Import from main index (recommended)
import type { GraphDiv, Layout, PlotData } from '../types';

// Or use path alias
import type { GraphDiv } from '@types';
```

## Directory Structure

```
types/
├── index.d.ts         # Main export - import from here
├── core/              # Core Plotly types (GraphDiv, Layout, Data, Config, Events)
├── traces/            # Trace-specific types
├── components/        # Component-specific types
├── plots/             # Plot-specific types
└── lib/               # Utility types
```

## Most Common Types

### GraphDiv
```typescript
import type { GraphDiv } from '../types';

function draw(gd: GraphDiv): void {
    const layout = gd._fullLayout;
    const data = gd._fullData;
}
```

### Layout
```typescript
import type { Layout } from '../types';

function updateLayout(layout: Partial<Layout>): void {
    layout.title = 'New Title';
}
```

### PlotData (Traces)
```typescript
import type { PlotData, ScatterTrace } from '../types';

function processTrace(trace: PlotData): void {
    if (trace.type === 'scatter') {
        const scatter = trace as ScatterTrace;
    }
}
```

## Adding New Types

1. Create file in appropriate subdirectory
2. Export from `index.d.ts`
3. Use in your TypeScript files
