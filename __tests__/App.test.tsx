// Fix: Import Jest globals to resolve TypeScript errors about missing type definitions for the test runner.
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { generateSchedule } from '../services/geminiService';
import { TournamentSchedule } from '../types';

// Mock the geminiService to control API responses in tests
jest.mock('../services/geminiService');
const mockedGenerateSchedule = generateSchedule as jest.Mock;

// Mock icon components to prevent SVG rendering issues in JSDOM
jest.mock('../components/icons/PencilIcon', () => ({ PencilIcon: () => <div data-testid="pencil-icon" /> }));
jest.mock('../components/icons/SettingsIcon', () => ({ SettingsIcon: () => <div data-testid="settings-icon" /> }));
jest.mock('../components/icons/CalendarIcon', () => ({ CalendarIcon: () => <div data-testid="calendar-icon" /> }));
jest.mock('../components/icons/TrashIcon', () => ({ TrashIcon: () => <div data-testid="trash-icon" /> }));


const initialMockSchedule: TournamentSchedule = [
  {
    day: 1,
    rounds: [
      {
        round: 1,
        matchups: [{ players: ['Player 1', 'Player 2'], scores: [null, null] }],
      },
    ],
  },
];

describe('App Component - Reset Tournament', () => {
  beforeEach(() => {
    mockedGenerateSchedule.mockClear();
    mockedGenerateSchedule.mockResolvedValue(initialMockSchedule);
  });

  test('should reset scores, names, and title by generating a new schedule when confirmed', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for initial load
    const player1ScoreInput = await screen.findByLabelText(/Score for Player 1/i);
    expect(mockedGenerateSchedule).toHaveBeenCalledTimes(1);

    // 1. Simulate changes to the state
    // Change title
    await user.click(screen.getByText('Tournament Schedule'));
    const titleInput = screen.getByRole('textbox');
    await user.clear(titleInput);
    await user.type(titleInput, 'My Custom Tournament');
    await user.keyboard('{enter}');
    expect(await screen.findByText('My Custom Tournament')).toBeInTheDocument();

    // Change player names
    await user.click(screen.getByRole('button', { name: /settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit player names/i }));
    const player1NameInput = await screen.findByLabelText(/Player 1/i);
    await user.clear(player1NameInput);
    await user.type(player1NameInput, 'Alice');
    await user.click(screen.getByRole('button', { name: /save & return/i }));
    const aliceScoreInput = await screen.findByLabelText(/Score for Alice/i); // Player 1 is now Alice
    
    // Change score
    await user.type(aliceScoreInput, '10');
    expect(aliceScoreInput).toHaveValue(10);
    
    // 2. Trigger Reset
    await user.click(screen.getByRole('button', { name: /settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /reset tournament/i }));
    
    // 3. Verify confirmation dialog and confirm
    expect(await screen.findByText('Reset Tournament?')).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    await user.click(confirmButton);
    
    await waitFor(() => {
      // Expect a second call for the reset
      expect(mockedGenerateSchedule).toHaveBeenCalledTimes(2);
    });

    // 4. Verify state has been reset
    await waitFor(() => {
        expect(screen.getByText('Tournament Schedule')).toBeInTheDocument(); // Title is reset
    });
    expect(screen.queryByText('My Custom Tournament')).not.toBeInTheDocument();

    expect(screen.getByLabelText(/Score for Player 1/i)).toBeInTheDocument(); // Player name is reset
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    
    const finalScoreInput = screen.getByLabelText(/Score for Player 1/i);
    expect(finalScoreInput).toHaveValue(null); // Score is reset
  });

  test('should not reset tournament if user cancels confirmation', async () => {
    const user = userEvent.setup();
    render(<App />);
    const player1ScoreInput = await screen.findByLabelText(/Score for Player 1/i);
    await user.type(player1ScoreInput, '8');
    expect(player1ScoreInput).toHaveValue(8);

    await user.click(screen.getByRole('button', { name: /settings/i }));
    await user.click(screen.getByRole('menuitem', { name: /reset tournament/i }));

    expect(await screen.findByText('Reset Tournament?')).toBeInTheDocument();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    // API should not be called a second time
    expect(mockedGenerateSchedule).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/Score for Player 1/i)).toHaveValue(8); // Score is not reset
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); // Dialog is gone
  });
});

describe('App Component - End and Save Tournament', () => {
    beforeEach(() => {
        mockedGenerateSchedule.mockClear();
        localStorage.clear();
        mockedGenerateSchedule.mockResolvedValue(initialMockSchedule);
    });

    test('should save the current tournament and start a new one when confirmed', async () => {
        const user = userEvent.setup();
        render(<App />);

        // Wait for initial load
        await screen.findByLabelText(/Score for Player 1/i);
        expect(mockedGenerateSchedule).toHaveBeenCalledTimes(1);

        // 1. Change some data
        await user.click(screen.getByText('Tournament Schedule'));
        const titleInput = screen.getByRole('textbox');
        await user.clear(titleInput);
        await user.type(titleInput, 'Spring Championship');
        await user.keyboard('{enter}');
        expect(await screen.findByText('Spring Championship')).toBeInTheDocument();

        const player1ScoreInput = screen.getByLabelText(/Score for Player 1/i);
        await user.type(player1ScoreInput, '15');

        // 2. Trigger End and Save
        await user.click(screen.getByRole('button', { name: /settings/i }));
        await user.click(screen.getByRole('menuitem', { name: /end and save tournament/i }));

        // 3. Confirm in the dialog
        const dialogTitle = await screen.findByText('End and Save "Spring Championship"?');
        expect(dialogTitle).toBeInTheDocument();
        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        await user.click(confirmButton);

        // 4. Verify a new schedule is generated
        await waitFor(() => {
            expect(mockedGenerateSchedule).toHaveBeenCalledTimes(2);
        });

        // 5. Verify the state is reset for the new tournament
        await waitFor(() => {
            expect(screen.getByText('Tournament Schedule')).toBeInTheDocument();
        });
        expect(screen.queryByText('Spring Championship')).not.toBeInTheDocument();
        const newScoreInput = await screen.findByLabelText(/Score for Player 1/i); // re-query
        expect(newScoreInput).toHaveValue(null);

        // 6. Verify the tournament was saved to localStorage
        const pastTournaments = JSON.parse(localStorage.getItem('pastTournaments') || '[]');
        expect(pastTournaments).toHaveLength(1);
        expect(pastTournaments[0].title).toBe('Spring Championship');
        expect(pastTournaments[0].stats).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'Player 1', totalPoints: 15, totalWins: 1 }),
                expect.objectContaining({ name: 'Player 2', totalPoints: 0, totalWins: 0 }),
            ])
        );

        // 7. Verify it appears in the Past Tournaments view
        await user.click(screen.getByRole('button', { name: /past tournaments/i }));
        expect(await screen.findByText('Spring Championship')).toBeInTheDocument();
    });

    test('should not save tournament if user cancels confirmation', async () => {
        const user = userEvent.setup();
        render(<App />);

        await screen.findByLabelText(/Score for Player 1/i);
        
        await user.click(screen.getByRole('button', { name: /settings/i }));
        await user.click(screen.getByRole('menuitem', { name: /end and save tournament/i }));

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        await user.click(cancelButton);
        
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        
        expect(mockedGenerateSchedule).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem('pastTournaments')).toBeNull();
    });
});

describe('App Component - Past Tournaments Management', () => {
    beforeEach(() => {
        mockedGenerateSchedule.mockClear();
        localStorage.clear();
        mockedGenerateSchedule.mockResolvedValue(initialMockSchedule);
    });

    test('should allow deleting a past tournament after confirmation', async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByText('Tournament Schedule'); // Wait for initial load

        // Save first tournament ("Tournament Schedule")
        await user.click(screen.getByRole('button', { name: /settings/i }));
        await user.click(screen.getByRole('menuitem', { name: /end and save tournament/i }));
        await user.click(await screen.findByRole('button', { name: 'Confirm' }));
        await waitFor(() => expect(mockedGenerateSchedule).toHaveBeenCalledTimes(2));

        // Save second tournament ("Second Tournament")
        await user.click(screen.getByText('Tournament Schedule'));
        const titleInput = screen.getByRole('textbox');
        await user.clear(titleInput);
        await user.type(titleInput, 'Second Tournament');
        await user.keyboard('{enter}');
        await user.click(screen.getByRole('button', { name: /settings/i }));
        await user.click(screen.getByRole('menuitem', { name: /end and save tournament/i }));
        await user.click(await screen.findByRole('button', { name: 'Confirm' }));
        await waitFor(() => expect(mockedGenerateSchedule).toHaveBeenCalledTimes(3));

        // Go to past tournaments view
        await user.click(screen.getByRole('button', { name: /past tournaments/i }));
        
        const firstTournamentTitle = await screen.findByText('Tournament Schedule');
        const secondTournamentTitle = await screen.findByText('Second Tournament');
        expect(firstTournamentTitle).toBeInTheDocument();
        expect(secondTournamentTitle).toBeInTheDocument();

        // Find the delete button associated with the second tournament
        const deleteButton = screen.getByRole('button', { name: 'Delete tournament Second Tournament' });
        expect(deleteButton).toBeInTheDocument();
        
        // Click delete and confirm
        await user.click(deleteButton!);
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('Are you sure you want to delete the tournament "Second Tournament"?');
        
        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        await user.click(confirmButton);

        // Verify it was deleted
        expect(screen.queryByText('Second Tournament')).not.toBeInTheDocument();
        expect(screen.getByText('Tournament Schedule')).toBeInTheDocument(); // First one is still there
        
        // Verify localStorage is updated
        const pastTournaments = JSON.parse(localStorage.getItem('pastTournaments') || '[]');
        expect(pastTournaments).toHaveLength(1);
        expect(pastTournaments[0].title).toBe('Tournament Schedule');
    });
});