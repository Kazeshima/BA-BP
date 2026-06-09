import { useDraftStore } from "../store/draftStore";

export default function ResetModal() {
  const {
    showResetModal, closeResetModal, confirmReset,
    showPartialResetModal, closePartialResetModal, confirmPartialReset,
  } = useDraftStore();

  return (
    <>
      {/* Full reset */}
      {showResetModal && (
        <div className="modal-backdrop" onMouseDown={closeResetModal}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>完全重置？</h3>
            <p>将清除所有禁用（含共享）、选择记录、计时器和比分。此操作无法撤销。</p>
            <div className="modal__actions">
              <button className="btn btn-ghost"   onClick={closeResetModal}>取消</button>
              <button className="btn btn-danger"  onClick={confirmReset}>确认完全重置</button>
            </div>
          </div>
        </div>
      )}

      {/* Partial reset */}
      {showPartialResetModal && (
        <div className="modal-backdrop" onMouseDown={closePartialResetModal}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>局间重置？</h3>
            <p>将清除各方独立禁用槽和出战阵容，<strong style={{color:"var(--accent-gold)"}}>保留共享禁用槽和比分</strong>。适用于多局比赛的轮次切换。</p>
            <div className="modal__actions">
              <button className="btn btn-ghost"    onClick={closePartialResetModal}>取消</button>
              <button className="btn btn-primary"  onClick={confirmPartialReset}>确认局间重置</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
