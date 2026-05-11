import { ChangeDetectorRef, Component } from '@angular/core';
import { PollService } from '../poll-service';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-poll',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './poll.html',
})
export class Poll {
  pollForm = new FormGroup({
    question: new FormControl('', [Validators.required, Validators.minLength(5)]),
    startDate: new FormControl('', [Validators.required]),
    endDate: new FormControl('', [Validators.required]),
    options: new FormArray([
      new FormControl('', [Validators.required]),
      new FormControl('', [Validators.required]),
    ]),
  });

  loading = false;
  errorMessage = '';
  successMessage = '';
  editingPollId: string | null = null;
  private editingPollOptions: any[] = [];

  constructor(
    private pollService: PollService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    const nav = this.router.currentNavigation();
    const editPoll = nav?.extras?.state?.['editPoll'];
    if (editPoll) {
      setTimeout(() => this.startEdit(editPoll), 0);
    }
  }

  get options(): FormArray {
    return this.pollForm.get('options') as FormArray;
  }

  addOption() {
    this.options.push(new FormControl('', Validators.required));
  }

  removeOption(i: number) {
    if (this.options.length > 2) {
      this.options.removeAt(i);
    }
  }

  toDateOnly(dateStr: string): string {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  startEdit(poll: any): void {
    this.editingPollId = poll._id;
    this.editingPollOptions = poll.options;
    this.successMessage = '';
    this.errorMessage = '';
    this.pollForm.patchValue({
      question: poll.question,
      startDate: this.toDateOnly(poll.startDate),
      endDate: this.toDateOnly(poll.endDate),
    });
    this.options.clear();
    poll.options.forEach((opt: any) => {
      this.options.push(new FormControl(opt.text, Validators.required));
    });
  }

  cancelEdit(): void {
    this.editingPollId = null;
    this.editingPollOptions = [];
    this.resetForm();
  }

  createPoll() {
    if (this.pollForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editingPollId) {
      const payload = {
        question: this.pollForm.value.question,
        startDate: new Date(this.pollForm.value.startDate!).toISOString(),
        endDate: new Date(this.pollForm.value.endDate! + 'T23:59:59').toISOString(),
        options: (this.pollForm.value.options || []).map((o: any, i: number) => {
          const original = this.editingPollOptions[i];
          return original ? { _id: original._id, text: o } : { text: o };
        }),
      };

      this.pollService.updatePoll(this.editingPollId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Poll updated successfully!';
          this.editingPollId = null;
          this.editingPollOptions = [];
          this.cdr.detectChanges();
          this.resetForm();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Failed to update poll. Please try again.';
          this.cdr.detectChanges();
        },
      });
    } else {
      const payload = {
        question: this.pollForm.value.question,
        startDate: new Date(this.pollForm.value.startDate!).toISOString(),
        endDate: new Date(this.pollForm.value.endDate! + 'T23:59:59').toISOString(),
        options: (this.pollForm.value.options || []).map((o: any) => ({ text: o })),
      };

      this.pollService.createPoll(payload).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Poll created successfully!';
          this.cdr.detectChanges();
          this.resetForm();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Failed to create poll. Please try again.';
          this.cdr.detectChanges();
        },
      });
    }
  }

  goToVoting() {
    this.router.navigate(['/vote']);
  }

  resetForm() {
    this.pollForm.reset();
    this.options.clear();
    this.options.push(new FormControl('', Validators.required));
    this.options.push(new FormControl('', Validators.required));
  }
}