declare module 'react-world-flags' {
  import * as React from 'react';

  export interface FlagProps extends React.HTMLAttributes<HTMLImageElement> {
    code: string;
    fallback?: React.ReactNode;
  }

  const Flag: React.ComponentType<FlagProps>;
  export default Flag;
}
