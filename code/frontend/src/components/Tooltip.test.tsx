import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip } from './Tooltip';
import { TrafficLight } from './TrafficLight';

describe('Tooltip', () => {
  it('renders the trigger (aria-label) and the tooltip text', () => {
    render(
      <Tooltip text="формула покрытия">
        <span>UTM 70%</span>
      </Tooltip>,
    );
    expect(screen.getByText('UTM 70%')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('формула покрытия');
    expect(screen.getByRole('button', { name: /Подсказка: формула покрытия/ })).toBeInTheDocument();
  });
});

describe('TrafficLight', () => {
  it('shows colour + icon + text for each status (not colour alone)', () => {
    const { rerender } = render(<TrafficLight status="green" />);
    expect(screen.getByText('Зелёный')).toBeInTheDocument();
    rerender(<TrafficLight status="yellow">CR 3–10%</TrafficLight>);
    expect(screen.getByText('CR 3–10%')).toBeInTheDocument();
    rerender(<TrafficLight status="red" />);
    expect(screen.getByText('Красный')).toBeInTheDocument();
  });
});
