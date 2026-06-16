import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Camera, Keyboard, ShieldCheck } from "lucide-react";
import { ControlPad } from "@/components/ControlPad";
import { GameShell } from "@/components/GameShell";
import { PuppetFigure } from "@/components/PuppetFigure";
import { roles } from "@/data/gameData";
import { useCameraPermission } from "@/hooks/useCameraPermission";
import { usePuppetControls } from "@/hooks/usePuppetControls";
import { useGameStore } from "@/store/gameStore";
import type { RoleId } from "@/types/game";

const lessons = [
  "右手主杆抬高：皮影身体上移，适合悟空亮相。",
  "左手手杆压低：手臂下沉，适合唐僧合掌或妖影掩面。",
  "双手拉开再定格：形成武戏横扫后的舞台停顿。",
];

export function RehearsalPage() {
  const params = useParams();
  const selectedRoleId = useGameStore((state) => state.selectedRoleId);
  const colors = useGameStore((state) => state.colors);
  const setPose = useGameStore((state) => state.setPose);
  const roleId = (params.roleId as RoleId | undefined) ?? selectedRoleId;
  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const camera = useCameraPermission();
  const controls = usePuppetControls();

  useEffect(() => {
    setPose(controls.pose);
  }, [controls.pose, setPose]);

  useEffect(() => {
    if (videoRef.current && camera.stream) {
      videoRef.current.srcObject = camera.stream;
    }
  }, [camera.stream]);

  return (
    <GameShell>
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-2 text-sm tracking-[0.4em] text-[#D99A2B]">第三步 · 幕后排练</p>
          <h1 className="font-serif text-5xl font-black text-[#F4E5C0]">用两只手让 {role.name} 活起来</h1>
          <p className="mt-4 text-[#F4E5C0]/68">
            摄像头只用于本地预览与手势练习；若授权失败，可以继续用下方双手控制板完成排练和演出。
          </p>

          <div className="mt-6 rounded-[1.8rem] border border-[#D99A2B]/20 bg-[#1C100B]/72 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-[#F4E5C0]/72">
                <ShieldCheck className="h-4 w-4 text-[#D99A2B]" />
                不上传、不保存原始摄像头画面
              </div>
              <button
                type="button"
                onClick={camera.requestCamera}
                className="inline-flex items-center gap-2 rounded-full bg-[#D99A2B] px-4 py-2 text-sm font-semibold text-[#120B08] transition hover:-translate-y-0.5"
              >
                <Camera className="h-4 w-4" />
                开启摄像头
              </button>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-[1.4rem] bg-[#120B08]">
              {camera.stream ? (
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover opacity-70" />
              ) : (
                <div className="grid h-full place-items-center text-center text-[#F4E5C0]/58">
                  <div>
                    <Keyboard className="mx-auto mb-3 h-9 w-9 text-[#D99A2B]" />
                    <p>{camera.errorMessage || "可选择开启摄像头，也可直接使用双手控制板。"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {lessons.map((lesson) => (
              <div key={lesson} className="rounded-2xl border border-[#F4E5C0]/10 bg-[#F4E5C0]/5 p-4 text-sm text-[#F4E5C0]/70">
                {lesson}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-[#D99A2B]/20 bg-[#1C100B]/75 p-5">
          <PuppetFigure role={role} pose={controls.pose} colors={{ ...colors, robe: colors.robe ?? role.color, prop: colors.prop ?? role.accent }} />
          <div className="mt-5">
            <ControlPad
              leftHand={controls.leftHand}
              rightHand={controls.rightHand}
              onLeftHandChange={controls.updateLeftHand}
              onRightHandChange={controls.updateRightHand}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <Link
              to={`/stage/${role.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#D99A2B] px-6 py-3 font-semibold text-[#120B08] transition hover:-translate-y-0.5"
            >
              进入正式演出
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </section>
    </GameShell>
  );
}
