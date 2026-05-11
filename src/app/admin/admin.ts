import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PollService } from '../poll-service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
})
export class Admin implements OnInit {
  polls: any[] = [];
  pollResults: { [pollId: string]: { results: any[]; totalVoters: number } } = {};
  loading = false;
  expandedPollId: string | null = null;
  searchQuery = '';
  deletingPollId: string | null = null;

  constructor(
    private pollService: PollService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllPolls();
  }

  loadAllPolls(): void {
    this.loading = true;
    this.pollService.getPolls(this.searchQuery).subscribe({
      next: (data: any[]) => {
        this.polls = data;
        this.loading = false;
        this.polls.forEach((poll) => this.loadResults(poll._id));
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSearch(): void {
    this.loadAllPolls();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadAllPolls();
  }

  loadResults(pollId: string): void {
    this.pollService.getResults(pollId).subscribe({
      next: (data: any) => {
        this.pollResults[pollId] = {
          results: data.results,
          totalVoters: data.totalVoters,
        };
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  deletePoll(pollId: string): void {
    if (!confirm('Are you sure you want to delete this poll? All votes will also be deleted.')) return;

    this.deletingPollId = pollId;
    this.pollService.deletePoll(pollId).subscribe({
      next: () => {
        this.polls = this.polls.filter((p) => p._id !== pollId);
        delete this.pollResults[pollId];
        this.deletingPollId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.deletingPollId = null;
        this.cdr.detectChanges();
      },
    });
  }

  toggleExpand(pollId: string): void {
    this.expandedPollId = this.expandedPollId === pollId ? null : pollId;
  }

  getResults(pollId: string) {
    return this.pollResults[pollId]?.results || [];
  }

  getTotalVoters(pollId: string): number {
    return this.pollResults[pollId]?.totalVoters || 0;
  }

  getVoteCount(pollId: string, optionText: string): number {
    const results = this.getResults(pollId);
    const found = results.find((r) => r.option === optionText);
    return found ? found.voteCount : 0;
  }

  getPercentage(pollId: string, optionText: string): number {
    const total = this.getTotalVoters(pollId);
    if (!total) return 0;
    return Math.round((this.getVoteCount(pollId, optionText) / total) * 100);
  }

  getTopOption(pollId: string): string {
    const results = this.getResults(pollId);
    return results.length ? results[0].option : 'No votes yet';
  }

  getTotalVotesAcrossAllPolls(): number {
    return this.polls.reduce((sum, poll) => sum + this.getTotalVoters(poll._id), 0);
  }

  getTotalOptions(): number {
    return this.polls.reduce((sum, poll) => sum + poll.options.length, 0);
  }

  getEndedPollsCount(): number {
    return this.polls.filter((poll) => this.isPollEnded(poll)).length;
  }

  isPollActive(poll: any): boolean {
    const now = new Date();
    return poll.isActive && new Date(poll.startDate) <= now && new Date(poll.endDate) >= now;
  }

  isPollUpcoming(poll: any): boolean {
    return new Date(poll.startDate) > new Date();
  }

  isPollEnded(poll: any): boolean {
    return new Date(poll.endDate) < new Date() || !poll.isActive;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  goToEdit(poll: any): void {
    this.router.navigate(['/polls'], { state: { editPoll: poll } });
  }

  goToVoting(): void {
    this.router.navigate(['/vote']);
  }

  refresh(): void {
    this.pollResults = {};
    this.loadAllPolls();
  }
}