package expo.modules.secureclipboard

import android.content.ClipData
import android.content.Context
import android.content.ClipboardManager
import android.os.Build
import android.os.PersistableBundle
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.TimeUnit

// Same value as ClipDescription.EXTRA_IS_SENSITIVE (API 33). Using the string
// directly lets keyboards like Gboard honour it on older Android versions too.
private const val EXTRA_IS_SENSITIVE = "android.content.extra.IS_SENSITIVE"

private const val CLEAR_WORK_NAME = "secure-clipboard-clear"

class SecureClipboardModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SecureClipboard")

    // Copies text flagged as sensitive (Android 13+ masks it in the "copied"
    // preview; keyboards skip saving it to clipboard history) and schedules a
    // clear after `clearAfterMs`. Scheduled with WorkManager because Android
    // freezes backgrounded apps, so in-process timers don't fire.
    AsyncFunction("setSensitiveStringAsync") { content: String, clearAfterMs: Double ->
      val clipboard = clipboardManager
      val clip = ClipData.newPlainText(null, content).apply {
        description.extras = PersistableBundle().apply {
          putBoolean(EXTRA_IS_SENSITIVE, true)
        }
      }
      clipboard.setPrimaryClip(clip)

      val copiedAt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        runCatching { clipboard.primaryClipDescription?.timestamp }.getOrNull()
      } else {
        null
      }

      val request = OneTimeWorkRequestBuilder<ClearClipboardWorker>()
        .setInitialDelay(clearAfterMs.toLong(), TimeUnit.MILLISECONDS)
        .setInputData(workDataOf(KEY_COPIED_AT to (copiedAt ?: -1L)))
        .build()
      // REPLACE: a new copy restarts the countdown.
      WorkManager.getInstance(context)
        .enqueueUniqueWork(CLEAR_WORK_NAME, ExistingWorkPolicy.REPLACE, request)
      // Don't let the Operation above leak out as the JS return value.
      Unit
    }

    AsyncFunction("clearAsync") {
      WorkManager.getInstance(context).cancelUniqueWork(CLEAR_WORK_NAME)
      clearClipboard(clipboardManager)
      Unit
    }
  }

  private val context: Context
    get() = requireNotNull(appContext.reactContext) {
      "React Application Context is null"
    }.applicationContext

  private val clipboardManager: ClipboardManager
    get() = requireNotNull(context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager) {
      "Clipboard service unavailable"
    }
}
