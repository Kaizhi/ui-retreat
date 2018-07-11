export default {
  template:
  `<div class="groot-corp">
    <div>
      <div class="groot-avatar"></div>
      <h3 class="corp-name">Groot Marijuana Blockchain Inc</h3>
    </div>
    <p class="corp-message">{{ message }}</p>
  </div>`,
  data() {
      return { message: 'I make money' }
  }
}