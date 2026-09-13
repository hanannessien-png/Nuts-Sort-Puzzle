import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppState, ScrollView, View } from 'react-native';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import type { Attempt } from '@/game/types';
import { useNutPalette } from '@/hooks/useThemeColors';
import { Column } from './Column';
import { Nut } from './Nut';
import { boardGeometry, type BoardGeometry } from './boardGeometry';

type Flight = {
  id: number; color: number; from: number; to: number; fromRow: number; toRow: number; alreadyLifted: boolean;
};

interface Props {
  active: Attempt;
  enabled: boolean;
  blocked: boolean;
  colorLabels: boolean;
  onTap: (index: number) => void;
  onBusy: (busy: boolean) => void;
  onSettled: (levelId: number, moves: number) => void;
}

export function PuzzleBoard({ active, enabled, blocked, colorLabels, onTap, onBusy, onSettled }: Props) {
  const [width, setWidth] = useState(360);
  const [flight, setFlight] = useState<Flight | null>(null);
  const previous = useRef(active);
  const latest = useRef(active);
  latest.current = active;
  const lock = useRef(false);
  const serial = useRef(0);
  const reduced = useReducedMotion();
  const palette = useNutPalette();
  const g = useMemo(() => boardGeometry(width, active.board.length, active.capacity), [width, active.board.length, active.capacity]);

  const settle = useCallback(() => {
    serial.current++;
    lock.current = false;
    setFlight(null);
    onBusy(false);
    onSettled(latest.current.levelId, latest.current.moves);
  }, [onBusy, onSettled]);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = active;
    if (!enabled || before.levelId !== active.levelId || before.board.length !== active.board.length || active.moves < before.moves) {
      settle();
      return;
    }
    if (active.board === before.board) {
      if (active.status === 'timeout' && !flight) {
        settle();
        return;
      }
      if (!lock.current || active.status === 'timeout') {
        if (!lock.current) onSettled(active.levelId, active.moves);
      }
      return;
    }
    const movedForward = active.history.length === before.history.length + 1;
    const movedBack = active.history.length === before.history.length - 1 && active.moves === before.moves + 1;
    const move = movedForward ? active.history.at(-1)
      : movedBack ? { from: before.history.at(-1)!.to, to: before.history.at(-1)!.from } : null;
    if (!move || reduced || !before.board[move.from]?.length) {
      settle();
      return;
    }
    const color = before.board[move.from].at(-1)!;
    if (active.board[move.to]?.at(-1) !== color) {
      settle();
      return;
    }
    lock.current = true;
    onBusy(true);
    setFlight({
      id: ++serial.current, color, from: move.from, to: move.to,
      fromRow: before.board[move.from].length - 1,
      toRow: active.board[move.to].length - 1,
      alreadyLifted: before.selected === move.from,
    });
  }, [active.board, active.levelId, active.moves, active.selected, active.status, enabled, reduced, onBusy, onSettled, settle]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') settle();
    });
    return () => subscription.remove();
  }, [settle]);

  const tap = (index: number) => {
    if (!enabled || blocked || lock.current || active.status !== 'playing') return;
    if (active.selected !== null && index !== active.selected && active.board[index].length < active.capacity) {
      lock.current = true;
      onBusy(true);
    }
    onTap(index);
  };

  const complete = useCallback((id: number) => {
    if (serial.current === id) settle();
  }, [settle]);

  return (
    <View testID="puzzle-board" onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ width: '100%', minHeight: g.height }}>
      <ScrollView horizontal scrollEnabled={!flight} showsHorizontalScrollIndicator={false} bounces={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ width: g.width, height: g.height, position: 'relative' }}>
          {active.board.map((nuts, index) => (
            <Column key={index} index={index} nuts={nuts} geometry={g}
              selected={enabled && !flight && active.selected === index}
              disabled={!enabled || blocked || !!flight || active.status !== 'playing'}
              hintSource={active.hint?.from === index} hintTarget={active.hint?.to === index}
              hiddenRow={flight?.to === index ? flight.toRow : undefined}
              colorLabels={colorLabels} onTap={tap} />
          ))}
          {flight && <FlyingPiece key={flight.id} flight={flight} geometry={g}
            color={palette[flight.color % palette.length]} label={colorLabels ? String.fromCharCode(65 + flight.color) : undefined}
            onComplete={complete} />}
        </View>
      </ScrollView>
    </View>
  );
}

function FlyingPiece({ flight: f, geometry: g, color, label, onComplete }: {
  flight: Flight; geometry: BoardGeometry; color: string; label?: string; onComplete: (id: number) => void;
}) {
  const x = useSharedValue(g.x(f.from));
  const y = useSharedValue(f.alreadyLifted ? g.liftY : g.y(f.fromRow));
  useEffect(() => {
    const lift = f.alreadyLifted ? 70 : 180;
    const cross = Math.min(340, 210 + Math.abs(f.to - f.from) * 30);
    y.value = withSequence(
      withTiming(g.liftY, { duration: lift, easing: Easing.out(Easing.cubic) }),
      withDelay(cross, withTiming(g.y(f.toRow), { duration: 180, easing: Easing.inOut(Easing.cubic) }, finished => {
        if (finished) runOnJS(onComplete)(f.id);
      })),
    );
    x.value = withDelay(lift, withTiming(g.x(f.to), { duration: cross, easing: Easing.inOut(Easing.cubic) }));
    return () => { cancelAnimation(x); cancelAnimation(y); };
  }, [f, g, onComplete, x, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));
  return (
    <Animated.View testID="moving-nut" accessibilityLabel={`Moving color ${f.color} above bolts from ${f.from + 1} to ${f.to + 1}`}
      pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, zIndex: 200 }, style]}>
      <Nut color={color} size={g.nutSize} label={label} />
    </Animated.View>
  );
}