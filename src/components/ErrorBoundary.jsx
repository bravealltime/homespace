import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HomeSpace App Crash caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#FAF8F5] p-5 font-sans">
          <div className="bg-white rounded-3xl border border-[#ECE7DF] shadow-xl max-w-sm w-full p-6 text-center animate-enter-rise">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FDF1EB] text-[#E88D67] flex items-center justify-center text-3xl mb-4 shadow-sm">
              🏡
            </div>
            <h2 className="text-lg font-black text-[#2D2825] mb-1.5">
              ขออภัย เกิดข้อผิดพลาดขึ้นชั่วคราว
            </h2>
            <p className="text-xs text-[#746C65] leading-relaxed mb-4">
              ระบบกำลังดูแลความปลอดภัยของข้อมูลบ้านคุณ กรุณาลองรีเฟรชหน้าเว็บอีกครั้ง
            </p>

            {this.state.error && (
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] text-[11px] text-red-500 font-mono text-left mb-4 overflow-x-auto max-h-24">
                {String(this.state.error?.message || this.state.error)}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 rounded-xl bg-[#5F8D75] hover:bg-[#4E7661] text-white text-xs font-bold shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                รีเฟรชหน้าเว็บ 🔄
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#ECE7DF] text-[#746C65] text-xs font-medium border border-[#ECE7DF] transition-colors cursor-pointer"
              >
                ล้างข้อมูลชั่วคราวแล้วเริ่มใหม่
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
