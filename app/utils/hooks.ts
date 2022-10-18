import { useCallback, useRef, useState } from "react";

export const useIds = (initialValue?: number | null | undefined) => {
  let initial: number[] = [];
  let currentId = useRef(initialValue || 0);

  if (initialValue === null || initialValue === undefined) {
    // nothing to do
  } else if (Array.isArray(initialValue)) {
    initial = initialValue;
  } else {
    initial = Array<number>(initialValue)
      .fill(0)
      .map((_, i) => i + 1);
  }

  const [ids, setIds] = useState(initial);

  const pushId = useCallback(() => {
    setIds([...ids, ++currentId.current]);
  }, [ids]);

  const removeId = useCallback(
    (id: number) => {
      let value = ids.filter((current) => current !== id);
      if (value.length === 0) {
        value.push(++currentId.current);
      }
      setIds(value);
    },
    [ids]
  );

  const insertAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= ids.length) {
        pushId();
        return;
      }
      let value = [...ids];
      value.splice(index, 0, ++currentId.current);
      setIds(value);
    },
    [ids]
  );

  const insertAfterId = useCallback(
    (elem: number) => {
      let value = [...ids];
      let index = value.findIndex((v) => v === elem);
      if (index === -1) {
        pushId();
        return;
      }
      value.splice(index + 1, 0, ++currentId.current);
      setIds(value);
    },
    [ids]
  );

  return { ids, pushId, removeId, insertAt, insertAfterId };
};

export const useDefault = <T>(
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return [value, setValue];
};
