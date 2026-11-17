import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Vangnet: bij een onverwachte fout een nette melding in plaats van een wit scherm. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Onverwachte fout in XXL Groeimaat', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-4 bg-xxl-grey p-6 text-center">
        <p className="text-2xl font-black uppercase">Er ging iets mis</p>
        <p className="text-sm text-xxl-black/80">Sorry, dit had niet mogen gebeuren. Je gegevens zijn bewaard.</p>
        <a href="/home" className="mx-auto flex min-h-12 items-center rounded-md bg-xxl-red px-6 text-sm font-extrabold text-xxl-white uppercase">
          Opnieuw laden
        </a>
      </div>
    );
  }
}
