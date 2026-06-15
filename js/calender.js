document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('month-year-display');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    let currentDate = new Date();
    
    // Database of fixed/special events
    const specialEvents = [
        {
            date: '2026-06-14', // Format: YYYY-MM-DD
            time: '4:00 PM — 7:30 PM',
            title: 'Valley Road Praise Experience',
            description: 'Corporate evening of deep praise and prophetic adoration.',
            type: 'concert'
        },
        {
            date: '2026-06-26',
            time: '9:00 PM — 5:00 AM',
            title: 'Mid-Year Breakthrough Kesha',
            description: 'Night vigil for territorial prayer and family breakthroughs.',
            type: 'prayer'
        }
    ];

    function generateSundayServices(year, month) {
        const services = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            // 0 represents Sunday in JavaScript
            if (date.getDay() === 0) {
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                // 1st Service
                services.push({
                    date: dateString,
                    time: '8:30 AM — 10:30 AM',
                    title: '1st Sunday Service',
                    description: 'Early morning corporate worship and practical discipleship.',
                    type: 'service'
                });
                
                // 2nd Service
                services.push({
                    date: dateString,
                    time: '11:30 AM — 1:30 PM',
                    title: '2nd Sunday Service',
                    description: 'Mid-morning gathering for worship and word administration.',
                    type: 'service'
                });
            }
        }
        return services;
    }

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Setup Date Formatting
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get all events for this month (Dynamic Sundays + Static Events)
        const sundayServices = generateSundayServices(year, month);
        const allEvents = [...specialEvents, ...sundayServices];

        // 1. Render empty slots for days before the 1st of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty-cell';
            calendarGrid.appendChild(emptyCell);
        }

        // 2. Render actual days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            
            // For mobile view, print the short day name alongside the number
            const dateObj = new Date(year, month, day);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            
            const dayNumHtml = `<span class="day-number ${isToday ? 'today' : ''}">
                                    <span class="mobile-day-label" style="display:none;">${dayName} </span>${day}
                                </span>`;
            
            let eventsHtml = '';
            
            // Format current iteration date to match event data strings (YYYY-MM-DD)
            const currentDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Filter and sort events for this specific day
            const dayEvents = allEvents.filter(e => e.date === currentDateString);
            
            // Order events by time roughly (AM before PM)
            dayEvents.sort((a, b) => a.time.localeCompare(b.time));

            dayEvents.forEach(event => {
                eventsHtml += `
                    <div class="calendar-event">
                        <span class="event-time">${event.time}</span>
                        <h4>${event.title}</h4>
                        <p>${event.description}</p>
                    </div>
                `;
            });

            dayCell.innerHTML = dayNumHtml + eventsHtml;
            
            // CSS fix specifically for the mobile view day labels
            if(window.innerWidth <= 991) {
                const mobileLabel = dayCell.querySelector('.mobile-day-label');
                if(mobileLabel) mobileLabel.style.display = 'inline';
            }

            calendarGrid.appendChild(dayCell);
        }
    }

    // Event Listeners for Navigation
    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Handle window resize to toggle mobile day labels correctly
    window.addEventListener('resize', renderCalendar);

    // Initial load
    renderCalendar();
});