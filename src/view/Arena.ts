import Phaser from "phaser";
import { CENTER, WORLD } from "../core/balance";
import { stats, type Profile, type Run } from "../core/model";
export class Arena extends Phaser.Scene {
  private pen!: Phaser.GameObjects.Graphics;
  constructor(private read: () => { profile: Profile; run: Run | null }) {
    super("arena");
  }
  create() {
    this.pen = this.add.graphics();
  }
  update() {
    const { profile, run } = this.read(),
      g = this.pen;
    g.clear();
    g.fillStyle(0x101512);
    g.fillRect(0, 0, WORLD, WORLD);
    g.lineStyle(1, 0x25352c);
    for (let n = 20; n < WORLD; n += 20) {
      g.lineBetween(n, 0, n, WORLD);
      g.lineBetween(0, n, WORLD, n);
    }
    const range = run ? stats(profile, run).range : 110;
    g.lineStyle(1, 0x476353, 0.8);
    g.strokeCircle(CENTER, CENTER, range);
    g.lineStyle(2, 0x77e5b1);
    g.strokeCircle(CENTER, CENTER, 15);
    g.fillStyle(0x77e5b1);
    g.fillRect(CENTER - 5, CENTER - 5, 10, 10);
    if (!run) return;
    const colors = {
      basic: 0xe3e8da,
      fast: 0xf1ce77,
      tank: 0xaf9af4,
      boss: 0xff7777,
    };
    for (const e of run.enemies) {
      g.fillStyle(colors[e.kind]);
      g.fillRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
      if (e.hp < e.maxHp) {
        g.fillStyle(0x49604f);
        g.fillRect(e.x - 8, e.y - e.radius - 6, 16, 2);
        g.fillStyle(0x77e5b1);
        g.fillRect(e.x - 8, e.y - e.radius - 6, (16 * e.hp) / e.maxHp, 2);
      }
    }
    g.fillStyle(0x77e5b1);
    for (const b of run.shots) g.fillCircle(b.x, b.y, 2);
  }
}
