import { useEffect, useState } from 'react';
import { store, type Machine } from './store';

/** The saved machines, kept up to date with every change (null until read). */
export function useMachines(): Machine[] | null {
  const [list, setList] = useState<Machine[] | null>(null);
  useEffect(() => {
    let live = true;
    void store.machines().then((v) => live && setList(v));
    const off = store.onMachines((v) => live && setList(v));
    return () => {
      live = false;
      off();
    };
  }, []);
  return list;
}
