import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl } from '@angular/forms';
import { PollService } from '../poll-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-voting',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './voting.html',
  styleUrls: ['./voting.css'],
})
export class Voting implements OnInit {
  polls: any[] = [];
  selectedPoll: any = null;
  results: any[] = [];
  totalVoters = 0;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';

  loadingPolls = false;
  loadingResults = false;
  submitting = false;
  hasVoted = false;

  get isLoading(): boolean {
    return this.loadingPolls || this.loadingResults || this.submitting;
  }

  voteForm = new FormGroup({
    selectedOption: new FormControl(null),
  });

  constructor(
    private pollService: PollService,
    private cdr: ChangeDetectorRef,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadPolls();
  }

  goToCreatePoll(): void {
    this.router.navigate(['/polls']);
  }

  goToEditPoll(poll: any): void {
    this.router.navigate(['/polls'], { state: { editPoll: poll } });
  }

  loadPolls(): void {
    this.loadingPolls = true;
    this.pollService.getPolls().subscribe({
      next: (data: any[]) => {
        this.polls = data;
        this.loadingPolls = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.setMessage('Failed to load polls. Please try again.', 'error');
        this.loadingPolls = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectPoll(poll: any): void {
    this.results = [];
    this.totalVoters = 0;
    this.hasVoted = false;
    this.message = '';
    this.voteForm.reset();
    this.selectedPoll = poll;
    this.loadResults();
  }

  goBack(): void {
    this.selectedPoll = null;
    this.results = [];
    this.totalVoters = 0;
    this.hasVoted = false;
    this.message = '';
    this.loadingResults = false;
    this.voteForm.reset();
  }

  submitVote(): void {
    const chosenId = this.voteForm.get('selectedOption')?.value;

    if (!chosenId) {
      this.setMessage('Please select an option before submitting.', 'error');
      return;
    }

    const user = this.pollService.getUser();
    if (!user) {
      this.setMessage('You must be logged in to vote.', 'error');
      return;
    }

    this.submitting = true;
    this.message = '';

    this.pollService
      .vote({ pollId: this.selectedPoll._id, userId: user.id, optionIds: [chosenId] })
      .subscribe({
        next: () => {
          this.hasVoted = true;
          this.setMessage('Your vote has been recorded!', 'success');
          this.submitting = false;
          this.cdr.detectChanges();
          this.loadResults();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to submit vote. Please try again.';
          this.setMessage(msg, 'error');
          this.submitting = false;
          this.cdr.detectChanges();
        },
      });
  }

  loadResults(): void {
    if (!this.selectedPoll) return;

    this.loadingResults = true;
    this.pollService.getResults(this.selectedPoll._id).subscribe({
      next: (data: any) => {
        this.results = data.results;
        this.totalVoters = data.totalVoters;
        this.loadingResults = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.setMessage('Failed to load results.', 'error');
        this.loadingResults = false;
        this.cdr.detectChanges();
      },
    });
  }

  getPercentage(voteCount: number): number {
    if (!this.totalVoters) return 0;
    return Math.round((voteCount / this.totalVoters) * 100);
  }

  getTopPercentage(): number {
    if (!this.results.length || !this.totalVoters) return 0;
    return Math.round((this.results[0].voteCount / this.totalVoters) * 100);
  }

  private setMessage(text: string, type: 'success' | 'error' | 'info'): void {
    this.message = text;
    this.messageType = type;
  }
}